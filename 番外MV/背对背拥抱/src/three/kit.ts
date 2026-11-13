import * as THREE from "three";
import type { Look } from "@/lib/mv";

/* ------------------------------------------------------------------ *
 * 积木：对应模板 engine/kit.ts 的口径——
 *   toon 材质（4 阶梯度）+ 反向外壳墨线；球面渐变天空；星星；特效贴片。
 * ------------------------------------------------------------------ */

export const INK = 0x221a3d;

let grad: THREE.DataTexture | null = null;
export function gradMap(): THREE.DataTexture {
  if (!grad) {
    const data = new Uint8Array([80, 140, 205, 255]);
    grad = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
    grad.minFilter = THREE.NearestFilter;
    grad.magFilter = THREE.NearestFilter;
    grad.needsUpdate = true;
  }
  return grad;
}

const toonCache = new Map<number, THREE.MeshToonMaterial>();
export function toon(color: number): THREE.MeshToonMaterial {
  let m = toonCache.get(color);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: gradMap() });
    toonCache.set(color, m);
  }
  return m;
}
export const toonOwn = (color: number, extra: Partial<THREE.MeshToonMaterialParameters> = {}) =>
  new THREE.MeshToonMaterial({ color, gradientMap: gradMap(), ...extra });

/** 低多边形切面：转非索引并重算面法线 */
export function faceted(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  n.computeVertexNormals();
  return n;
}

const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });

/** 体块自带墨线：同一几何体放大一圈、只画背面。 */
export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, ink = 0.045): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (ink > 0) {
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const size = new THREE.Vector3();
    const c = new THREE.Vector3();
    bb.getSize(size);
    bb.getCenter(c);
    const hull = new THREE.Mesh(geo, inkMat);
    const sx = size.x > 1e-3 ? 1 + (2 * ink) / size.x : 1;
    const sy = size.y > 1e-3 ? 1 + (2 * ink) / size.y : 1;
    const sz = size.z > 1e-3 ? 1 + (2 * ink) / size.z : 1;
    hull.scale.set(sx, sy, sz);
    hull.position.set(c.x * (1 - sx), c.y * (1 - sy), c.z * (1 - sz));
    m.add(hull);
  }
  return m;
}

export const box = (w: number, h: number, d: number, color: number, ink = 0.045) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return mesh(g, toon(color), ink);
};
export const cyl = (rt: number, rb: number, h: number, color: number, segs = 14, ink = 0.045) => {
  const g = new THREE.CylinderGeometry(rt, rb, h, segs);
  g.translate(0, h / 2, 0);
  return mesh(segs < 8 ? faceted(g) : g, toon(color), ink);
};
export const cone = (r: number, h: number, color: number, segs = 12, ink = 0.045) => {
  const g = new THREE.ConeGeometry(r, h, segs);
  if (segs === 4) g.rotateY(Math.PI / 4);
  g.translate(0, h / 2, 0);
  return mesh(segs < 8 ? faceted(g) : g, toon(color), ink);
};
export const ball = (r: number, color: number, flat = false, ink = 0.045) =>
  mesh(flat ? faceted(new THREE.IcosahedronGeometry(r, 1)) : new THREE.SphereGeometry(r, 18, 12), toon(color), ink);
export const disc = (r: number, color: number, y = 0.01) => {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 48), toon(color));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.receiveShadow = true;
  return m;
};

/* ---------------- 天空 / 星 ---------------- */
export function makeSky(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    toneMapped: false,
    uniforms: {
      top: { value: new THREE.Color(0x3e86de) },
      hor: { value: new THREE.Color(0xbfe0f7) },
      low: { value: new THREE.Color(0x4a3f6b) },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 low; varying vec3 vDir;
void main(){ float y = normalize(vDir).y; vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.55)) : mix(hor, low, pow(min(-y*5.0,1.0), 0.7)); gl_FragColor = vec4(c,1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 16), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

export function makeStars(n = 900): THREE.Points {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = Math.asin(Math.random() * 0.92 + 0.06);
    const r = 520;
    pos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    pos[i * 3 + 1] = Math.sin(e) * r;
    pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0xfff6dc, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  p.renderOrder = -9;
  return p;
}

/* ---------------- 特效贴片 ---------------- */
export type FxName =
  | "star"
  | "glow"
  | "heart"
  | "note"
  | "bubble"
  | "butterfly"
  | "petal"
  | "smoke"
  | "ring"
  | "drop"
  | "leaf"
  | "spark";

const fxCache = new Map<string, THREE.Texture>();
function canvasTex(key: string, size: number, draw: (c: CanvasRenderingContext2D, s: number) => void): THREE.Texture {
  let t = fxCache.get(key);
  if (t) return t;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const c = cv.getContext("2d")!;
  draw(c, size);
  t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  fxCache.set(key, t);
  return t;
}

export function fxTex(name: FxName): THREE.Texture {
  return canvasTex(`fx:${name}`, 128, (c, s) => {
    const h = s / 2;
    c.clearRect(0, 0, s, s);
    c.fillStyle = "#fff";
    c.strokeStyle = "#fff";
    c.lineCap = "round";
    c.lineJoin = "round";
    switch (name) {
      case "glow": {
        const g = c.createRadialGradient(h, h, 0, h, h, h);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.35, "rgba(255,255,255,.55)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, s, s);
        break;
      }
      case "smoke": {
        const g = c.createRadialGradient(h, h, 0, h, h, h);
        g.addColorStop(0, "rgba(255,255,255,.7)");
        g.addColorStop(0.6, "rgba(255,255,255,.18)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = g;
        c.fillRect(0, 0, s, s);
        break;
      }
      case "star":
      case "spark": {
        const pts = name === "star" ? 5 : 4;
        const inner = name === "star" ? 0.42 : 0.22;
        c.beginPath();
        for (let i = 0; i < pts * 2; i++) {
          const r = (i % 2 === 0 ? 1 : inner) * (h - 6);
          const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
          c.lineTo(h + Math.cos(a) * r, h + Math.sin(a) * r);
        }
        c.closePath();
        c.fill();
        break;
      }
      case "heart": {
        c.beginPath();
        c.moveTo(h, s * 0.86);
        c.bezierCurveTo(s * 0.05, s * 0.55, s * 0.12, s * 0.12, h, s * 0.3);
        c.bezierCurveTo(s * 0.88, s * 0.12, s * 0.95, s * 0.55, h, s * 0.86);
        c.fill();
        break;
      }
      case "note": {
        c.lineWidth = 9;
        c.beginPath();
        c.ellipse(s * 0.36, s * 0.72, 17, 12, -0.4, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(s * 0.5, s * 0.7);
        c.lineTo(s * 0.5, s * 0.18);
        c.quadraticCurveTo(s * 0.72, s * 0.22, s * 0.78, s * 0.42);
        c.stroke();
        break;
      }
      case "bubble": {
        c.lineWidth = 6;
        c.beginPath();
        c.arc(h, h, h - 8, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.arc(h - 14, h - 14, 9, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case "ring": {
        c.lineWidth = 7;
        c.beginPath();
        c.arc(h, h, h - 8, 0, Math.PI * 2);
        c.stroke();
        break;
      }
      case "petal": {
        c.beginPath();
        c.ellipse(h, h, h * 0.78, h * 0.46, 0.5, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case "leaf": {
        c.beginPath();
        c.moveTo(10, h);
        c.quadraticCurveTo(h, 8, s - 10, h);
        c.quadraticCurveTo(h, s - 8, 10, h);
        c.fill();
        break;
      }
      case "butterfly": {
        c.beginPath();
        c.ellipse(h - 22, h - 8, 24, 30, 0.4, 0, Math.PI * 2);
        c.ellipse(h + 22, h - 8, 24, 30, -0.4, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.ellipse(h - 16, h + 22, 14, 16, 0.3, 0, Math.PI * 2);
        c.ellipse(h + 16, h + 22, 14, 16, -0.3, 0, Math.PI * 2);
        c.fill();
        break;
      }
      case "drop": {
        const g = c.createLinearGradient(0, 0, 0, s);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(1, "rgba(255,255,255,1)");
        c.fillStyle = g;
        c.fillRect(h - 5, 0, 10, s);
        break;
      }
    }
  });
}

export function sprite(name: FxName, size = 1, color = 0xffffff, additive = false, opacity = 1): THREE.Sprite {
  const m = new THREE.SpriteMaterial({
    map: fxTex(name),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1);
  return s;
}

/** 纸条：一个字写在一张小纸片上（歌词碎片 / 旧账） */
export function slipTex(ch: string, variant: "paper" | "gold" | "dim" = "paper"): THREE.Texture {
  return canvasTex(`slip:${variant}:${ch}:${fontEpoch}`, 128, (c, s) => {
    c.clearRect(0, 0, s, s);
    const r = 10;
    c.beginPath();
    c.roundRect(6, 6, s - 12, s - 12, r);
    if (variant === "paper") {
      const g = c.createLinearGradient(0, 0, 0, s);
      g.addColorStop(0, "#fffaf0");
      g.addColorStop(1, "#f3e3c6");
      c.fillStyle = g;
    } else if (variant === "dim") {
      c.fillStyle = "rgba(36,28,68,.94)";
    } else {
      c.fillStyle = "#2a1d3f";
    }
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = variant === "paper" ? "rgba(34,26,61,.55)" : "#ffd166";
    c.stroke();
    c.font = `${s * 0.6}px "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (variant === "gold") {
      c.shadowColor = "rgba(255,209,102,.9)";
      c.shadowBlur = 18;
      c.fillStyle = "#ffd84a";
    } else {
      c.fillStyle = variant === "paper" ? "#2a1d3f" : "rgba(255,255,255,.5)";
    }
    c.fillText(ch, s / 2, s / 2 + 4);
  });
}

/** 字体就绪后把带字的贴图作废重画 */
export let fontEpoch = 0;
export function bumpFontEpoch() {
  fontEpoch += 1;
  for (const k of [...fxCache.keys()]) if (k.startsWith("slip:") || k.startsWith("label:")) fxCache.delete(k);
}

export function labelTex(text: string): THREE.Texture {
  return canvasTex(`label:${text}:${fontEpoch}`, 256, (c, s) => {
    c.clearRect(0, 0, s, s);
    c.beginPath();
    c.roundRect(8, s * 0.36, s - 16, s * 0.28, 8);
    c.fillStyle = "#fff6e6";
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = "#ffd166";
    c.stroke();
    c.font = `${s * 0.15}px "ZCOOL KuaiLe", "PingFang SC", sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#2a1d3f";
    c.fillText(text, s / 2, s / 2 + 2);
  });
}

/* ---------------- 常用场景件 ---------------- */
function seeded(seed: number) {
  let a = seed * 9301 + 49297;
  return () => {
    a = (a * 9301 + 49297) % 233280;
    return a / 233280;
  };
}

export function tree(h: number, color = 0x4fb85a, seed = 1): THREE.Group {
  const g = new THREE.Group();
  const r = seeded(seed);
  g.add(cyl(0.16 * h * 0.5, 0.26 * h * 0.5, h * 0.5, 0x7a4a2c, 7));
  const crown = ball(h * 0.42, color);
  crown.position.y = h * 0.72;
  g.add(crown);
  const c2 = ball(h * 0.3, color);
  c2.position.set((r() - 0.5) * h * 0.5, h * 0.55, (r() - 0.5) * h * 0.4);
  g.add(c2);
  const c3 = ball(h * 0.26, color);
  c3.position.set((r() - 0.5) * h * 0.5, h * 0.62, (r() - 0.5) * h * 0.4);
  g.add(c3);
  return g;
}

export function pine(h: number, color = 0x2f7a5a): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.08 * h, 0.12 * h, h * 0.3, 0x6b4630, 7));
  for (let i = 0; i < 3; i++) {
    const c = cone(h * (0.34 - i * 0.07), h * 0.42, color, 8);
    c.position.y = h * (0.22 + i * 0.22);
    g.add(c);
  }
  return g;
}

export function cloud(seed: number, s = 1, color = 0xffffff): THREE.Group {
  const g = new THREE.Group();
  const r = seeded(seed);
  const mat = toonOwn(color, { fog: true });
  const n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const rad = (0.7 + r() * 0.8) * s;
    const b = mesh(new THREE.SphereGeometry(rad, 14, 10), mat, 0.05);
    b.position.set((i - n / 2) * 1.1 * s + (r() - 0.5) * 0.4, (r() - 0.3) * 0.5 * s, (r() - 0.5) * 0.7 * s);
    b.castShadow = false;
    g.add(b);
  }
  return g;
}

export function lantern(color = 0xffc85a): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.05, 0.07, 2.2, 0x4a3a2a, 8));
  const arm = box(0.7, 0.06, 0.06, 0x4a3a2a);
  arm.position.set(0.3, 2.15, 0);
  g.add(arm);
  const body = mesh(new THREE.SphereGeometry(0.26, 12, 10), toonOwn(color, { emissive: color, emissiveIntensity: 0.55 }), 0.04);
  body.position.set(0.6, 1.8, 0);
  g.add(body);
  const cap = cone(0.2, 0.16, 0xc9922f, 8);
  cap.position.set(0.6, 2.05, 0);
  g.add(cap);
  const glow = sprite("glow", 2.2, color, true, 0.6);
  glow.position.set(0.6, 1.8, 0);
  glow.name = "glow";
  g.add(glow);
  return g;
}

export function house(color = 0xfff1dc, roof = 0xe2725b, w = 2.6, h = 2.1): THREE.Group {
  const g = new THREE.Group();
  g.add(box(w, h, w * 0.85, color));
  const r = cone(w * 0.78, h * 0.7, roof, 4);
  r.position.y = h;
  g.add(r);
  const door = box(w * 0.22, h * 0.45, 0.08, 0x8d6a4f, 0.03);
  door.position.set(0, 0, w * 0.43);
  g.add(door);
  for (const sx of [-1, 1]) {
    const win = mesh(new THREE.BoxGeometry(w * 0.2, h * 0.2, 0.08), toonOwn(0xffd166, { emissive: 0xffb347, emissiveIntensity: 0.6 }), 0.03);
    win.position.set(sx * w * 0.28, h * 0.62, w * 0.43);
    g.add(win);
  }
  const chimney = box(0.3, 0.6, 0.3, 0x9a6a5a);
  chimney.position.set(w * 0.28, h + 0.3, -w * 0.1);
  g.add(chimney);
  return g;
}

export function flower(color = 0xf7a8c4, h = 0.6): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.025, 0.03, h, 0x4f7a4a, 6, 0));
  for (let i = 0; i < 5; i++) {
    const p = mesh(new THREE.SphereGeometry(0.09, 8, 6), toon(color), 0);
    const a = (i / 5) * Math.PI * 2;
    p.position.set(Math.cos(a) * 0.11, h + Math.sin(a) * 0.11 * 0.3 + 0.02, Math.sin(a) * 0.11);
    p.scale.set(1, 0.5, 1);
    g.add(p);
  }
  const c = ball(0.07, 0xffd166);
  c.position.y = h + 0.03;
  g.add(c);
  return g;
}

export function rock(s = 1, color = 0x7d7a93): THREE.Mesh {
  const m = ball(0.5 * s, color, true);
  m.scale.set(1.3, 0.75, 1);
  return m;
}

export function paperBoat(): THREE.Group {
  const g = new THREE.Group();
  const hull = box(1.2, 0.26, 0.5, 0xfff6e6);
  g.add(hull);
  const sail = cone(0.36, 0.7, 0xffd9e2, 4);
  sail.position.set(0.1, 0.26, 0);
  g.add(sail);
  return g;
}

export function clock(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.9, 0.16, 0.6, 0x8a6244));
  const post = box(0.36, 0.5, 0.3, 0xa8794f);
  post.position.y = 0.16;
  g.add(post);
  const face = mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.16, 32), toon(0xfff8ea), 0.05);
  face.rotation.x = Math.PI / 2;
  face.position.y = 1.4;
  g.add(face);
  const rim = mesh(new THREE.TorusGeometry(0.75, 0.06, 8, 36), toon(0xc9922f), 0.03);
  rim.position.y = 1.4;
  rim.position.z = 0.08;
  g.add(rim);
  const hand1 = box(0.06, 0.55, 0.04, 0xe0574f, 0.015);
  hand1.position.set(0, 1.4, 0.12);
  hand1.name = "hand1";
  g.add(hand1);
  const hand2 = box(0.06, 0.42, 0.04, 0x221a3d, 0.015);
  hand2.position.set(0, 1.4, 0.13);
  hand2.name = "hand2";
  g.add(hand2);
  return g;
}

export function scroll(len = 4): THREE.Group {
  const g = new THREE.Group();
  const paper = box(len, 0.03, 0.9, 0xfff8e6, 0.02);
  paper.position.y = 0.02;
  g.add(paper);
  for (const sx of [-1, 1]) {
    const roll = cyl(0.14, 0.14, 1.1, 0xd9b98a, 10);
    roll.rotation.x = Math.PI / 2;
    roll.position.set((sx * len) / 2, 0.14, 0.55);
    g.add(roll);
  }
  const n = Math.floor(len * 3);
  for (let i = 0; i < n; i++) {
    const mark = box(0.05, 0.02, 0.4 + (i % 3 === 0 ? 0.2 : 0), 0x221a3d, 0);
    mark.position.set(-len / 2 + 0.3 + (i * (len - 0.6)) / (n - 1), 0.05, 0.05);
    g.add(mark);
  }
  const tag = box(0.4, 0.03, 0.34, 0xffd166, 0.02);
  tag.position.set(-len * 0.2, 0.055, 0.1);
  g.add(tag);
  return g;
}

export function fan(): THREE.Group {
  const g = new THREE.Group();
  const blade = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.03, 20, 1, false, Math.PI * 0.15, Math.PI * 0.7), toon(0xf6d7a8), 0.02);
  blade.rotation.x = Math.PI / 2;
  blade.position.y = 1.1;
  g.add(blade);
  const stick = box(0.05, 0.9, 0.05, 0x6b4630, 0.01);
  stick.position.y = 0.3;
  g.add(stick);
  return g;
}

export function note(): THREE.Group {
  const g = new THREE.Group();
  const paper = box(0.56, 0.7, 0.03, 0xfffdf3, 0.02);
  paper.rotation.z = -0.08;
  paper.position.y = 0.35;
  g.add(paper);
  for (let i = 0; i < 3; i++) {
    const line = box(0.34 - i * 0.06, 0.03, 0.01, 0x221a3d, 0);
    line.position.set(-0.03, 0.9 - i * 0.14, 0.02);
    g.add(line);
  }
  const seal = ball(0.07, 0xf7a8c4);
  seal.position.set(0.14, 0.5, 0.03);
  g.add(seal);
  return g;
}

export function board(): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.1, 1.1, 0.1, 0x8a6244));
  const b = box(1.1, 0.8, 0.06, 0xfff8e6);
  b.position.y = 1.0;
  g.add(b);
  const a = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), new THREE.MeshBasicMaterial({ map: slipTex("先"), transparent: true }));
  a.position.set(-0.24, 1.4, 0.04);
  g.add(a);
  const c = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.36), new THREE.MeshBasicMaterial({ map: slipTex("再"), transparent: true }));
  c.position.set(0.24, 1.4, 0.04);
  g.add(c);
  return g;
}

/** 地上的光圈（魔法阵 / 「兜圈子」） */
export function ringArch(r = 2.4, color = 0xffd166): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, fog: false });
  for (const [rr, t] of [
    [r, 0.06],
    [r * 0.72, 0.03],
    [r * 1.25, 0.025],
  ]) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(rr, t, 8, 72), mat);
    m.rotation.x = Math.PI / 2;
    m.position.y = 0.04;
    g.add(m);
  }
  const glow = new THREE.Mesh(new THREE.RingGeometry(r * 0.6, r * 1.1, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, fog: false }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.03;
  g.add(glow);
  return g;
}

export function kelp(h = 3, color = 0x3fa37a): THREE.Group {
  const g = new THREE.Group();
  const segs = 4;
  for (let i = 0; i < segs; i++) {
    const s = cone(0.18 - i * 0.03, h / segs + 0.1, color, 6, 0.03);
    s.position.y = (i * h) / segs;
    s.name = `seg${i}`;
    g.add(s);
  }
  return g;
}

export function crystal(h = 1.6, color = 0xc78bff): THREE.Mesh {
  const m = mesh(faceted(new THREE.ConeGeometry(0.35, h, 5)), toonOwn(color, { emissive: color, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 }), 0.04);
  m.geometry.translate(0, h / 2, 0);
  return m;
}

export function mound(rx: number, h: number, color: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), toonOwn(color));
  m.scale.set(rx, h, rx * 0.8);
  m.receiveShadow = true;
  return m;
}

export function setLookSky(sky: THREE.Mesh, look: Look) {
  const u = (sky.material as THREE.ShaderMaterial).uniforms;
  (u.top.value as THREE.Color).setHex(look.top);
  (u.hor.value as THREE.Color).setHex(look.hor);
  (u.low.value as THREE.Color).setHex(look.low);
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const backOut = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const p = clamp01(t);
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
