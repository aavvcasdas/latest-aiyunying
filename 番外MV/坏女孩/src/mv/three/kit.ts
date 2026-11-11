import * as THREE from "three";
import { FONT, hash, hash2 } from "../core";
import type { AtlasData } from "./actors";

// ---------------- 材质 ----------------
export const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

export function toon(color: THREE.ColorRepresentation, emissive: THREE.ColorRepresentation = 0x000000, ei = 1) {
  return new THREE.MeshToonMaterial({ color, gradientMap: GRAD, emissive, emissiveIntensity: ei });
}
export function basic(color: THREE.ColorRepresentation, opacity = 1, additive = false) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1 || additive,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !(opacity < 1 || additive),
  });
}
const INK = new THREE.MeshBasicMaterial({ color: 0x0a0712, side: THREE.BackSide });
const INK_T = 0.03;

type Mat = THREE.Material | THREE.Material[];
const asMat = (m: THREE.ColorRepresentation | Mat): Mat =>
  m instanceof THREE.Material || Array.isArray(m) ? m : toon(m as THREE.ColorRepresentation);

/** 体块：底面在 y=0，自带墨线 */
export function box(w: number, h: number, d: number, m: THREE.ColorRepresentation | Mat, ink = true) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  const mesh = new THREE.Mesh(g, asMat(m));
  if (ink) {
    const o = new THREE.Mesh(g, INK);
    o.scale.set((w + 2 * INK_T) / w, (h + 2 * INK_T) / h, (d + 2 * INK_T) / d);
    o.position.y = -INK_T;
    mesh.add(o);
  }
  return mesh;
}
export function cyl(rt: number, rb: number, h: number, m: THREE.ColorRepresentation | Mat, seg = 16, ink = true) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg);
  g.translate(0, h / 2, 0);
  const mesh = new THREE.Mesh(g, asMat(m));
  if (ink) {
    const r = Math.max(rt, rb, 0.01);
    const o = new THREE.Mesh(g, INK);
    o.scale.set((r + INK_T) / r, (h + 2 * INK_T) / h, (r + INK_T) / r);
    o.position.y = -INK_T;
    mesh.add(o);
  }
  return mesh;
}
export function ball(r: number, m: THREE.ColorRepresentation | Mat, seg = 16, ink = true) {
  const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1));
  const mesh = new THREE.Mesh(g, asMat(m));
  if (ink) {
    const o = new THREE.Mesh(g, INK);
    o.scale.setScalar((r + INK_T) / r);
    mesh.add(o);
  }
  return mesh;
}
export function disc(r: number, m: THREE.ColorRepresentation | Mat, seg = 32) {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(r, seg), asMat(m));
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
export function plane(w: number, h: number, m: THREE.ColorRepresentation | Mat) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), asMat(m));
}
export function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, ry = 0): T {
  o.position.set(x, y, z);
  o.rotation.y = ry;
  return o;
}

// ---------------- 贴图 ----------------
export function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, nearest = false) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  if (nearest) {
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
  }
  return t;
}

const GLOW = canvasTex(128, 128, (c) => {
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
});
const STAR = canvasTex(64, 64, (c) => {
  c.fillStyle = "#fff";
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 ? 7 : 31;
    const a = (i / 8) * Math.PI * 2;
    c.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
  }
  c.fill();
});
const DROP = canvasTex(32, 48, (c) => {
  c.fillStyle = "#cfe6ff";
  c.beginPath();
  c.moveTo(16, 2);
  c.quadraticCurveTo(30, 30, 16, 46);
  c.quadraticCurveTo(2, 30, 16, 2);
  c.fill();
});
const HEART = canvasTex(64, 64, (c) => {
  c.fillStyle = "#fff";
  c.beginPath();
  c.moveTo(32, 56);
  c.bezierCurveTo(-8, 28, 14, -2, 32, 18);
  c.bezierCurveTo(50, -2, 72, 28, 32, 56);
  c.fill();
});
const PETAL = canvasTex(32, 32, (c) => {
  c.fillStyle = "#ffc2d6";
  c.beginPath();
  c.ellipse(16, 16, 14, 7, 0.6, 0, Math.PI * 2);
  c.fill();
});
export const FX_TEX = { glow: GLOW, star: STAR, drop: DROP, heart: HEART, petal: PETAL };

export function fx(kind: keyof typeof FX_TEX, color: THREE.ColorRepresentation, size: number, opacity = 1, additive = true) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: FX_TEX[kind],
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    })
  );
  s.scale.set(size, size, 1);
  return s;
}
export const glow = (color: THREE.ColorRepresentation, size: number, opacity = 1) => fx("glow", color, size, opacity);
export function setOpacity(o: THREE.Object3D, a: number) {
  const m = (o as THREE.Mesh).material as THREE.Material & { opacity: number };
  m.opacity = a;
  o.visible = a > 0.001;
}

// 楼窗贴图：8×8 格，按 seed 决定亮灯
const winCache = new Map<number, THREE.CanvasTexture>();
export function windowTex(seed: number) {
  const key = seed % 7;
  let t = winCache.get(key);
  if (!t) {
    t = canvasTex(256, 256, (c) => {
      c.fillStyle = "#000";
      c.fillRect(0, 0, 256, 256);
      for (let r = 0; r < 8; r++)
        for (let k = 0; k < 8; k++) {
          const h = hash2(key * 31 + r, k);
          if (h < 0.42) {
            c.fillStyle = h < 0.12 ? "#7fd0ff" : h < 0.16 ? "#ff9ad5" : "#ffcf7a";
            c.globalAlpha = 0.6 + 0.4 * hash2(r + key, k * 3);
            c.fillRect(k * 32 + 7, r * 32 + 6, 18, 20);
          }
        }
      c.globalAlpha = 1;
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    winCache.set(key, t);
  }
  return t;
}
export function building(w: number, h: number, d: number, seed: number, body = 0x141a33, ink = false, glowK = 1) {
  const tex = windowTex(seed).clone();
  tex.repeat.set(Math.max(1, w / 2.6), Math.max(1, h / 2.8));
  tex.needsUpdate = true;
  const side = new THREE.MeshLambertMaterial({ color: body, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: glowK });
  const roof = new THREE.MeshLambertMaterial({ color: body });
  return box(w, h, d, [side, side, roof, roof, side, side], ink);
}

// ---------------- 文字贴图 ----------------
export function textTex(text: string, o: { w?: number; h?: number; size?: number; color?: string; bg?: string; stroke?: string; glow?: string } = {}) {
  const w = o.w ?? 512;
  const h = o.h ?? 128;
  return canvasTex(w, h, (c) => {
    if (o.bg) {
      c.fillStyle = o.bg;
      c.fillRect(0, 0, w, h);
    }
    c.font = `${o.size ?? 72}px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    if (o.glow) {
      c.shadowColor = o.glow;
      c.shadowBlur = 24;
    }
    if (o.stroke) {
      c.lineWidth = 8;
      c.strokeStyle = o.stroke;
      c.strokeText(text, w / 2, h / 2 + 4);
    }
    c.fillStyle = o.color ?? "#fff";
    c.fillText(text, w / 2, h / 2 + 4);
  });
}

/** 对话 / 思绪气泡（精灵，锚点在底边中点）。portrait = 图集里的头像格 */
export function bubble(o: { text?: string; dots?: number; portrait?: string; atlas?: AtlasData; think?: boolean; w?: number }) {
  const W2 = 320;
  const H2 = 240;
  const tex = canvasTex(W2, H2, (c) => {
    c.fillStyle = "#fffaf4";
    c.strokeStyle = "#2a1d2e";
    c.lineWidth = 8;
    if (o.think) {
      c.beginPath();
      c.ellipse(160, 100, 140, 88, 0, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      for (const [x, y, r] of [
        [118, 206, 16],
        [96, 228, 9],
      ]) {
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
    } else {
      c.beginPath();
      c.roundRect(20, 20, 280, 160, 40);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(130, 176);
      c.lineTo(150, 226);
      c.lineTo(180, 176);
      c.fill();
      c.stroke();
      c.fillRect(126, 168, 58, 12);
    }
    if (o.portrait && o.atlas) {
      const r = o.atlas.s[o.portrait];
      c.imageSmoothingEnabled = false;
      c.drawImage(o.atlas.img, r[0], r[1], r[2], r[3], 160 - 70, 100 - 70, 140, 140);
    }
    if (o.text) {
      c.font = `64px ${FONT}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "#2a1d2e";
      c.fillText(o.text, 160, 104);
    }
    if (o.dots) {
      c.fillStyle = "#2a1d2e";
      for (let i = 0; i < o.dots; i++) {
        c.beginPath();
        c.arc(160 + (i - (o.dots - 1) / 2) * 44, 100, 12, 0, Math.PI * 2);
        c.fill();
      }
    }
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const w = o.w ?? 1.0;
  s.scale.set(w, (w * H2) / W2, 1);
  s.center.set(0.5, 0);
  return s;
}

// ---------------- 道具 ----------------
export interface Prop {
  g: THREE.Group;
  set: (k: number, T?: number) => void;
}

export function umbrella(color = 0xff6f91): Prop {
  const g = new THREE.Group();
  const canopyG = new THREE.ConeGeometry(0.72, 0.32, 8, 1, true);
  canopyG.translate(0, -0.16, 0);
  const canopy = new THREE.Mesh(canopyG, new THREE.MeshToonMaterial({ color, gradientMap: GRAD, side: THREE.DoubleSide }));
  const ink = new THREE.Mesh(canopyG, INK);
  ink.scale.setScalar(1.04);
  canopy.add(ink);
  canopy.position.y = 0.32;
  const shaft = cyl(0.014, 0.014, 0.95, 0x2a1d2e, 6, false);
  shaft.position.y = -0.62;
  const tip = cyl(0.01, 0.02, 0.1, 0x2a1d2e, 6, false);
  tip.position.y = 0.3;
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 6, 12, Math.PI), toon(0x2a1d2e));
  handle.position.set(-0.06, -0.62, 0);
  handle.rotation.z = Math.PI;
  g.add(canopy, shaft, tip, handle);
  return {
    g,
    set: (k) => {
      const s = 0.18 + 0.82 * k;
      canopy.scale.set(s, 1 + (1 - k) * 1.6, s);
    },
  };
}

export function cocktail(color = 0xff4d8d, s = 1): THREE.Group {
  const g = new THREE.Group();
  const glass = new THREE.MeshBasicMaterial({ color: 0xdfe9ff, transparent: true, opacity: 0.35, depthWrite: false });
  const base = cyl(0.06, 0.06, 0.01, glass, 12, false);
  const stem = cyl(0.008, 0.008, 0.12, glass, 6, false);
  const bowlG = new THREE.ConeGeometry(0.09, 0.1, 14, 1, true);
  bowlG.rotateX(Math.PI);
  bowlG.translate(0, 0.17, 0);
  const bowl = new THREE.Mesh(bowlG, glass);
  const liqG = new THREE.ConeGeometry(0.075, 0.08, 14);
  liqG.rotateX(Math.PI);
  liqG.translate(0, 0.16, 0);
  const liq = new THREE.Mesh(liqG, basic(color));
  const olive = ball(0.014, 0x7cff7c, 8, false);
  olive.position.set(0.02, 0.2, 0);
  g.add(base, stem, bowl, liq, olive);
  g.scale.setScalar(s);
  return g;
}

export function scooter(): Prop {
  const g = new THREE.Group();
  const pink = toon(0xff5fa0);
  const dark = toon(0x221a2a);
  const body = box(1.1, 0.22, 0.34, pink);
  body.position.y = 0.2;
  const seat = box(0.5, 0.1, 0.3, dark);
  seat.position.set(-0.2, 0.44, 0);
  const seatPost = box(0.3, 0.14, 0.26, pink);
  seatPost.position.set(-0.2, 0.32, 0);
  const neck = box(0.1, 0.6, 0.12, pink);
  neck.position.set(0.48, 0.32, 0);
  neck.rotation.z = -0.25;
  const bar = cyl(0.02, 0.02, 0.6, dark, 8, false);
  bar.rotation.x = Math.PI / 2;
  bar.position.set(0.64, 0.95, -0.3);
  const lamp = glow(0xfff2c8, 0.9, 0.9);
  lamp.position.set(0.66, 0.78, 0);
  const beamG = new THREE.ConeGeometry(0.9, 3.2, 20, 1, true);
  beamG.rotateZ(Math.PI / 2);
  beamG.translate(2.2, 0, 0);
  const beam = new THREE.Mesh(beamG, basic(0xfff0c8, 0.12, true));
  beam.position.set(0.66, 0.7, 0);
  const wheels: THREE.Mesh[] = [];
  for (const x of [-0.42, 0.5]) {
    const wg = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
    wg.rotateX(Math.PI / 2);
    const w = new THREE.Mesh(wg, dark);
    w.position.set(x, 0.2, 0);
    const hub = box(0.32, 0.04, 0.13, 0x9aa0b0, false);
    hub.position.y = -0.02;
    w.add(hub);
    wheels.push(w);
    g.add(w);
  }
  g.add(body, seat, seatPost, neck, bar, lamp, beam);
  return { g, set: (_k, T = 0) => wheels.forEach((w) => (w.rotation.z = -T * 14)) };
}

export function pencil(): THREE.Group {
  const g = new THREE.Group();
  const b = cyl(0.018, 0.018, 0.36, 0x111014, 8, false);
  const tip = cyl(0.0, 0.018, 0.05, 0x050405, 8, false);
  tip.rotation.z = Math.PI;
  tip.position.y = 0;
  b.position.y = 0;
  const cap = cyl(0.019, 0.019, 0.04, 0xffd36b, 8, false);
  cap.position.y = 0.32;
  g.add(b, tip, cap);
  return g;
}

export function door(w = 1.1, h = 2.2, color = 0x4a2a5a): Prop {
  const g = new THREE.Group();
  const frame = box(w + 0.24, h + 0.14, 0.12, 0x1b1022);
  const light = plane(w, h, basic(0xffd6f0));
  light.position.set(0, h / 2, 0.065);
  const pivot = new THREE.Group();
  pivot.position.set(-w / 2, 0, 0.1);
  const panel = box(w, h, 0.06, color);
  panel.position.x = w / 2;
  const knob = ball(0.04, 0xffd98a, 8, false);
  knob.position.set(w - 0.14, h * 0.48, 0.05);
  panel.add(knob);
  pivot.add(panel);
  const spill = glow(0xff9ad5, 3.2, 0);
  spill.position.set(0, h * 0.5, 0.6);
  g.add(frame, light, pivot, spill);
  return {
    g,
    set: (k) => {
      pivot.rotation.y = -k * 1.6;
      setOpacity(spill, 0.6 * k);
    },
  };
}

export function phone(): Prop {
  const g = new THREE.Group();
  const body = box(0.2, 0.36, 0.03, 0x181a24);
  const cache = new Map<string, THREE.CanvasTexture>();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const screen = plane(0.17, 0.3, mat);
  screen.position.set(0, 0.18, 0.017);
  const lightG = glow(0x8fb8ff, 0.9, 0);
  lightG.position.set(0, 0.18, 0.08);
  g.add(body, screen, lightG);
  const tex = (key: string) => {
    let t = cache.get(key);
    if (!t) {
      const [mode, nS] = key.split(":");
      const n = Number(nS);
      t = canvasTex(68, 120, (c) => {
        c.fillStyle = mode === "off" ? "#05060a" : "#0f1b33";
        c.fillRect(0, 0, 68, 120);
        if (mode !== "off") {
          c.fillStyle = "#1d2b4d";
          c.fillRect(6, 16, 56, 3);
          c.fillStyle = "#3a5a9a";
          c.beginPath();
          c.roundRect(6, 90, 56, 18, 9);
          c.fill();
          c.fillStyle = "#e0ecff";
          for (let i = 0; i < n; i++) {
            c.beginPath();
            c.arc(12 + i * 7, 99, 2.4, 0, Math.PI * 2);
            c.fill();
          }
          c.fillRect(12 + n * 7, 93, 2, 12);
        }
      }, true);
      cache.set(key, t);
    }
    return t;
  };
  return {
    g,
    // k < 0：黑屏；k >= 0：亮屏并打出 k 个点
    set: (k) => {
      const key = k < 0 ? "off:0" : `on:${Math.round(k)}`;
      mat.map = tex(key);
      mat.needsUpdate = true;
      setOpacity(lightG, k < 0 ? 0 : 0.5);
    },
  };
}

export function calendar(): Prop {
  const g = new THREE.Group();
  const cache = new Map<number, THREE.CanvasTexture>();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const p = plane(0.62, 0.7, mat);
  g.add(p);
  return {
    g,
    set: (k) => {
      const n = Math.max(1, Math.floor(k));
      let t = cache.get(n);
      if (!t) {
        t = canvasTex(124, 140, (c) => {
          c.fillStyle = "#f4efe6";
          c.fillRect(0, 0, 124, 140);
          c.fillStyle = "#d9534f";
          c.fillRect(0, 0, 124, 34);
          c.fillStyle = "#1e1e2e";
          c.font = `64px ${FONT}`;
          c.textAlign = "center";
          c.textBaseline = "middle";
          c.fillText(String(n), 62, 92);
        });
        cache.set(n, t);
      }
      mat.map = t;
      mat.needsUpdate = true;
    },
  };
}

export function neonSign(text: string, color: string, w: number, h: number): Prop {
  const tex = textTex(text, { w: 512, h: Math.round((512 * h) / w), size: Math.round((512 * h) / w) * 0.72, color: "#fff7fb", glow: color });
  const g = new THREE.Group();
  const backing = box(w + 0.2, h + 0.16, 0.08, 0x150a1e);
  backing.position.y = -0.08;
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color });
  const p = plane(w, h, m);
  p.position.set(0, h / 2, 0.06);
  const gl = glow(color, Math.max(w, h) * 2.2, 0.5);
  gl.position.set(0, h / 2, 0.2);
  g.add(backing, p, gl);
  return {
    g,
    set: (k) => {
      m.opacity = k;
      setOpacity(gl, 0.5 * k);
      p.visible = k > 0.01;
    },
  };
}

export function sofa(w = 3.2, color = 0x5b2a6b): THREE.Group {
  const g = new THREE.Group();
  const seat = box(w, 0.42, 0.9, color);
  const back = box(w, 0.75, 0.25, color);
  back.position.set(0, 0.4, -0.42);
  const armL = box(0.25, 0.65, 0.9, color);
  armL.position.set(-w / 2 + 0.12, 0, 0);
  const armR = armL.clone();
  armR.position.x = w / 2 - 0.12;
  g.add(seat, back, armL, armR);
  return g;
}
export function table(w: number, d: number, h: number, top = 0x2b1a33, leg = 0x1a0f20): THREE.Group {
  const g = new THREE.Group();
  const t = box(w, 0.07, d, top);
  t.position.y = h - 0.07;
  g.add(t);
  for (const [x, z] of [
    [-w / 2 + 0.08, -d / 2 + 0.08],
    [w / 2 - 0.08, -d / 2 + 0.08],
    [-w / 2 + 0.08, d / 2 - 0.08],
    [w / 2 - 0.08, d / 2 - 0.08],
  ]) {
    const l = box(0.06, h - 0.07, 0.06, leg, false);
    l.position.set(x, 0, z);
    g.add(l);
  }
  return g;
}

// ---------------- 天空、雨 ----------------
export class Sky {
  mesh: THREE.Mesh;
  stars: THREE.Points;
  moon: THREE.Group;
  uni = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, bot: { value: new THREE.Color() } };
  constructor() {
    const m = new THREE.ShaderMaterial({
      uniforms: this.uni,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 bot; varying vec3 vP;
        void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(hor, top, pow(clamp(h*1.4,0.0,1.0),0.7)) : mix(hor, bot, clamp(-h*4.0,0.0,1.0));
        gl_FragColor = vec4(c,1.0);
        #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), m);
    this.mesh.renderOrder = -10;
    this.mesh.frustumCulled = false;
    const pos: number[] = [];
    for (let i = 0; i < 600; i++) {
      const a = hash(i) * Math.PI * 2;
      const y = 0.08 + hash(i + 0.5) * 0.92;
      const r = Math.sqrt(1 - y * y);
      pos.push(Math.cos(a) * r * 300, y * 300, Math.sin(a) * r * 300);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false }));
    this.stars.renderOrder = -9;
    this.stars.frustumCulled = false;
    this.moon = new THREE.Group();
    const md = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshBasicMaterial({ color: 0xfff3c8, fog: false }));
    const crater = new THREE.Mesh(new THREE.CircleGeometry(2, 20), new THREE.MeshBasicMaterial({ color: 0xe6d6a8, fog: false }));
    crater.position.set(-2.5, 1.8, 0.1);
    const mg = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0xfff0c8, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    mg.scale.set(70, 70, 1);
    this.moon.add(mg, md, crater);
    this.moon.renderOrder = -8;
  }
  follow(cam: THREE.Camera, moonDir: THREE.Vector3) {
    this.mesh.position.copy(cam.position);
    this.stars.position.copy(cam.position);
    this.moon.position.copy(cam.position).addScaledVector(moonDir, 250);
    this.moon.lookAt(cam.position);
  }
}

export class Rain {
  lines: THREE.LineSegments;
  N = 1600;
  private pos: Float32Array;
  constructor() {
    this.pos = new Float32Array(this.N * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xa8c4ff, transparent: true, opacity: 0.5, depthWrite: false }));
    this.lines.frustumCulled = false;
  }
  /** 雨只下在人物所在的那一段纵深里，不下到镜头跟前 */
  update(T: number, amount: number, cx: number, cz: number, wind: number, color: THREE.ColorRepresentation) {
    const n = Math.floor(this.N * Math.min(1.5, amount) / 1.5);
    this.lines.visible = n > 0;
    (this.lines.material as THREE.LineBasicMaterial).color.set(color);
    const SX = 26;
    const SZ = 12;
    const HY = 10;
    for (let i = 0; i < n; i++) {
      const sp = 9 + 5 * hash(i + 0.3);
      const y = HY - ((hash(i + 0.7) * HY + T * sp) % HY);
      const x = cx + (hash(i) - 0.5) * SX + wind * (HY - y) * 0.12;
      const z = cz + (hash(i + 0.11) - 0.5) * SZ;
      const L = 0.32 + 0.2 * hash(i + 0.9);
      const o = i * 6;
      this.pos[o] = x;
      this.pos[o + 1] = y;
      this.pos[o + 2] = z;
      this.pos[o + 3] = x - wind * L * 0.12;
      this.pos[o + 4] = y + L;
      this.pos[o + 5] = z;
    }
    this.lines.geometry.setDrawRange(0, n * 2);
    (this.lines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
