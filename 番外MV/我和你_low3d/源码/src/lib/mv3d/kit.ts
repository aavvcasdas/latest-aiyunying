import * as THREE from "three";
import type { Assets, Frame } from "../mv/assets";
import { rnd } from "../mv/draw";

/** 1 像素 = 0.02 世界单位（单帧约 84×90 → 约 1.7 单位高）。 */
export const PX = 0.02;

export type Update = (lt: number, p: number, t: number) => void;
export type Builder = (k: Kit) => Update;

export type Post = { flash: number; flashColor: string; vignette: number; vignetteColor: string };

// ───────────────────── 像素纸片人 ─────────────────────
export class Sprite {
  mesh: THREE.Mesh;
  geo: THREE.PlaneGeometry;
  mat: THREE.MeshBasicMaterial;
  flip = false;
  scale = 1;
  billboard = true;
  private img: HTMLImageElement | null = null;

  constructor(private w: World3D, frame: Frame | null, scale = 1) {
    this.geo = new THREE.PlaneGeometry(1, 1);
    this.geo.translate(0, 0.5, 0);
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.scale = scale;
    if (frame) this.setFrame(frame);
  }

  setFrame(f: Frame) {
    if (f.img !== this.img) {
      this.img = f.img;
      this.mat.map = this.w.tex(f.img);
      this.mat.needsUpdate = true;
    }
    const W = f.img.width, H = f.img.height, e = 0.4;
    const u0 = (f.x + e) / W, u1 = (f.x + f.w - e) / W;
    const v1 = 1 - (f.y + e) / H, v0 = 1 - (f.y + f.h - e) / H;
    const uv = this.geo.attributes.uv as THREE.BufferAttribute;
    uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
    uv.needsUpdate = true;
    const k = PX * this.scale;
    this.mesh.scale.set(f.w * k * (this.flip ? -1 : 1), f.h * k, 1);
  }

  get position() { return this.mesh.position; }
  set opacity(a: number) { this.mat.opacity = a; this.mat.alphaTest = a < 1 ? 0.05 : 0.3; this.mesh.visible = a > 0.01; }
  /** >1 会把角色提亮（发光感），<1 压暗。 */
  setBright(r: number, g = r, b = r) { this.mat.color.setRGB(r, g, b); }
}

export class Actor extends Sprite {
  fps = 8;
  loop = true;
  tOffset = 0;
  constructor(w: World3D, private A: Assets, public char: string, public action: string, scale = 1) {
    super(w, A.act(char, action, 0), scale);
  }
  update(t: number) {
    const f = this.A.act(this.char, this.action, t + this.tOffset, this.fps, this.loop);
    if (f) this.setFrame(f);
  }
}

// ───────────────────── 世界 ─────────────────────
export class World3D {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 2000);
  glowTex: THREE.Texture;
  private texCache = new Map<HTMLImageElement, THREE.Texture>();

  constructor(public A: Assets, width: number, height: number) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(width, height, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.add(this.camera);
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.6)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    this.glowTex = new THREE.CanvasTexture(c);
    this.glowTex.colorSpace = THREE.SRGBColorSpace;
  }

  tex(img: HTMLImageElement) {
    let t = this.texCache.get(img);
    if (!t) {
      t = new THREE.Texture(img);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.colorSpace = THREE.SRGBColorSpace;
      t.needsUpdate = true;
      this.texCache.set(img, t);
    }
    return t;
  }
}

// ───────────────────── 搭景工具 ─────────────────────
export class Kit {
  group = new THREE.Group();
  camGroup = new THREE.Group();
  sprites: Sprite[] = [];
  actors: Actor[] = [];
  post: Post = { flash: 0, flashColor: "255,255,255", vignette: 0.25, vignetteColor: "0,0,0" };
  private disposables: { dispose: () => void }[] = [];
  private geoCache = new Map<string, THREE.BufferGeometry>();
  private matCache = new Map<string, THREE.Material>();
  readonly A: Assets;
  readonly cam: THREE.PerspectiveCamera;

  constructor(public w: World3D) {
    this.A = w.A;
    this.cam = w.camera;
    w.camera.add(this.camGroup);
    w.scene.fog = null;
    w.scene.background = new THREE.Color("#000");
    w.camera.fov = 45;
    w.camera.updateProjectionMatrix();
  }

  add<T extends THREE.Object3D>(o: T, parent: THREE.Object3D = this.group): T { parent.add(o); return o; }
  track<T extends { dispose: () => void }>(d: T): T { this.disposables.push(d); return d; }
  geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
    let g = this.geoCache.get(key) as T | undefined;
    if (!g) { g = make(); this.geoCache.set(key, g); }
    return g;
  }
  lam(color: THREE.ColorRepresentation, extra: THREE.MeshLambertMaterialParameters = {}) {
    const key = "lam" + String(color) + JSON.stringify(extra);
    let m = this.matCache.get(key) as THREE.MeshLambertMaterial | undefined;
    if (!m) { m = new THREE.MeshLambertMaterial({ color, ...extra }); this.matCache.set(key, m); }
    return m;
  }
  basic(color: THREE.ColorRepresentation, extra: THREE.MeshBasicMaterialParameters = {}) {
    return new THREE.MeshBasicMaterial({ color, ...extra });
  }

  look(px: number, py: number, pz: number, tx: number, ty: number, tz: number, fov?: number) {
    this.cam.position.set(px, py, pz);
    this.cam.lookAt(tx, ty, tz);
    if (fov && fov !== this.cam.fov) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
  }
  /** 绕 (tx,ty,tz) 以半径 r、角度 a 环绕。 */
  orbit(a: number, r: number, h: number, tx = 0, ty = 1, tz = 0, fov?: number) {
    this.look(tx + Math.sin(a) * r, h, tz + Math.cos(a) * r, tx, ty, tz, fov);
  }

  fog(color: THREE.ColorRepresentation, near: number, far: number) {
    this.w.scene.fog = new THREE.Fog(color, near, far);
  }

  lights(hemi = 1.1, dir = 1.6, dirPos: [number, number, number] = [10, 20, 12], sky = "#ffffff", groundCol = "#88aa77") {
    const h = this.add(new THREE.HemisphereLight(sky, groundCol, hemi));
    const d = this.add(new THREE.DirectionalLight("#fff6e8", dir));
    d.position.set(...dirPos);
    return { h, d };
  }

  sky(top: string, bottom: string, horizon?: string) {
    const uni = {
      top: { value: new THREE.Color(top) },
      bottom: { value: new THREE.Color(bottom) },
      hor: { value: new THREE.Color(horizon ?? bottom) },
    };
    const mat = this.track(new THREE.ShaderMaterial({
      uniforms: uni, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 bottom; uniform vec3 hor; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(hor, top, pow(clamp(h*1.4,0.0,1.0),0.7)) : mix(hor, bottom, clamp(-h*3.0,0.0,1.0)); gl_FragColor = vec4(c,1.0);\n#include <colorspace_fragment>\n}",
    }));
    const m = this.add(new THREE.Mesh(this.geo("skydome", () => new THREE.SphereGeometry(900, 32, 16)), mat));
    m.renderOrder = -10;
    this.w.scene.background = null;
    return uni;
  }

  ground(color: string, r = 400, y = 0) {
    const m = this.add(new THREE.Mesh(this.geo("ground" + r, () => new THREE.CircleGeometry(r, 48)), this.lam(color)));
    m.rotation.x = -Math.PI / 2; m.position.y = y;
    return m;
  }

  hill(x: number, z: number, r: number, h: number, color: string) {
    const m = this.add(new THREE.Mesh(this.geo("hill", () => new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), this.lam(color)));
    m.position.set(x, 0, z); m.scale.set(r, h, r);
    return m;
  }

  hillsRing(colors = ["#7fcf74", "#5fbf5f", "#93d98a"], radius = 70, n = 12, seed = 1) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rnd(i + seed);
      const r = radius * (0.8 + rnd(i * 3 + seed) * 0.5);
      this.hill(Math.sin(a) * r, Math.cos(a) * r, 18 + rnd(i * 5 + seed) * 22, 6 + rnd(i * 7 + seed) * 10, colors[i % colors.length]);
    }
  }

  cloud(x: number, y: number, z: number, s = 1, color = "#ffffff", opacity = 1) {
    const g = this.add(new THREE.Group());
    const mat = opacity < 1 ? this.lam(color, { transparent: true, opacity, emissive: "#dfe9f6", emissiveIntensity: 0.6 }) : this.lam(color, { emissive: "#e4edf8", emissiveIntensity: 0.62 });
    const geo = this.geo("cloudball", () => new THREE.IcosahedronGeometry(1, 2));
    const balls: [number, number, number, number][] = [[0, 0, 0, 1.4], [1.5, 0.3, 0.2, 1.1], [-1.5, -0.1, 0.1, 1.0], [0.6, 0.8, -0.3, 1.0], [-0.6, 0.6, 0.4, 0.9], [2.6, -0.2, 0, 0.7], [-2.5, -0.3, -0.1, 0.65]];
    for (const [bx, by, bz, br] of balls) { const m = new THREE.Mesh(geo, mat); m.position.set(bx, by, bz); m.scale.set(br, br * 0.8, br); g.add(m); }
    g.position.set(x, y, z); g.scale.setScalar(s);
    return g;
  }

  clouds(n: number, area: { x: [number, number]; y: [number, number]; z: [number, number] }, s: [number, number], seed = 3, color = "#fff", opacity = 1) {
    const out: THREE.Group[] = [];
    for (let i = 0; i < n; i++) {
      out.push(this.cloud(
        area.x[0] + rnd(i + seed) * (area.x[1] - area.x[0]),
        area.y[0] + rnd(i * 3 + seed) * (area.y[1] - area.y[0]),
        area.z[0] + rnd(i * 7 + seed) * (area.z[1] - area.z[0]),
        s[0] + rnd(i * 11 + seed) * (s[1] - s[0]), color, opacity));
    }
    return out;
  }

  glow(color: THREE.ColorRepresentation, size: number, opacity = 1, parent?: THREE.Object3D) {
    const mat = this.track(new THREE.SpriteMaterial({ map: this.w.glowTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const s = new THREE.Sprite(mat);
    s.scale.setScalar(size);
    this.add(s, parent ?? this.group);
    return s;
  }

  sun(x: number, y: number, z: number, r = 6) {
    const g = this.add(new THREE.Group());
    g.position.set(x, y, z);
    g.add(new THREE.Mesh(this.geo("sunball", () => new THREE.SphereGeometry(1, 32, 16)), this.basic("#ffd84a", { fog: false })));
    (g.children[0] as THREE.Mesh).scale.setScalar(r);
    this.glow("#fff0a0", r * 7, 0.9, g);
    const rays = new THREE.Group();
    const rayMat = this.track(new THREE.MeshBasicMaterial({ color: "#fff3b0", transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const rayGeo = this.geo("sunray", () => { const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(-0.12, 1); s.lineTo(0.12, 1); s.lineTo(0, 0); return new THREE.ShapeGeometry(s); });
    for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(rayGeo, rayMat); m.rotation.z = (i / 12) * Math.PI * 2; m.scale.setScalar(r * 3); rays.add(m); }
    g.add(rays);
    g.userData.rays = rays;
    return g;
  }

  moon(x: number, y: number, z: number, r = 4) {
    const g = this.add(new THREE.Group());
    g.position.set(x, y, z);
    g.add(new THREE.Mesh(this.geo("sunball", () => new THREE.SphereGeometry(1, 32, 16)), this.basic("#f6f2d0", { fog: false })));
    (g.children[0] as THREE.Mesh).scale.setScalar(r);
    this.glow("#c8d2ff", r * 6, 0.6, g);
    return g;
  }

  stars(n = 900, r = 500, size = 2.2) {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = rnd(i) * Math.PI * 2, ph = Math.acos(rnd(i + 7) * 1.6 - 0.6);
      pos[i * 3] = Math.sin(ph) * Math.cos(th) * r; pos[i * 3 + 1] = Math.cos(ph) * r; pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
    }
    const geo = this.track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = this.track(new THREE.PointsMaterial({ color: "#fffbe0", size, sizeAttenuation: false, transparent: true, opacity: 1, fog: false, depthWrite: false }));
    return this.add(new THREE.Points(geo, mat));
  }

  actor(char: string, action: string, scale = 1, x = 0, y = 0, z = 0) {
    const a = new Actor(this.w, this.A, char, action, scale * (char === "gpt" && action !== "fly" ? 0.62 : 1));
    a.position.set(x, y, z);
    a.tOffset = rnd(this.actors.length + 1) * 2;
    this.add(a.mesh);
    this.actors.push(a); this.sprites.push(a);
    return a;
  }

  /** 道具纸片：生成的像素道具（public/mv/props）或母版图集里的 prop_* 帧。 */
  prop(name: string, scale = 1, x = 0, y = 0, z = 0) {
    const img = this.A.props.get(name);
    const frame: Frame | null = img ? { img, x: 0, y: 0, w: img.width, h: img.height } : this.A.frame("prop_" + name) ?? this.A.frame("fx_" + name);
    const s = new Sprite(this.w, frame, scale);
    s.position.set(x, y, z);
    this.add(s.mesh);
    this.sprites.push(s);
    return s;
  }

  fx(name: string, scale = 1, x = 0, y = 0, z = 0) {
    const list = this.A.actions.get("fx_" + name);
    const f = list ? list[0] : this.A.frame("fx_" + name);
    const s = new Sprite(this.w, f, scale);
    s.position.set(x, y, z);
    s.mesh.userData.fxList = list;
    this.add(s.mesh);
    this.sprites.push(s);
    return s;
  }
  animFx(s: Sprite, t: number) {
    const list = s.mesh.userData.fxList as Frame[] | undefined;
    if (list?.length) s.setFrame(list[Math.floor(t * 8) % list.length]);
  }

  flower(color: string, s = 1, x = 0, z = 0) {
    const g = this.add(new THREE.Group());
    const stem = new THREE.Mesh(this.geo("stem", () => { const c = new THREE.CylinderGeometry(0.05, 0.07, 1, 6); c.translate(0, 0.5, 0); return c; }), this.lam("#3a9a4a"));
    const leaf = new THREE.Mesh(this.geo("leaf", () => new THREE.SphereGeometry(0.22, 8, 6)), this.lam("#4cb85a"));
    leaf.scale.set(1, 0.3, 0.5); leaf.position.set(0.18, 0.4, 0);
    const head = new THREE.Group(); head.position.y = 1;
    const petalGeo = this.geo("petal", () => new THREE.SphereGeometry(0.22, 10, 8));
    const pm = this.lam(color, { emissive: color, emissiveIntensity: 0.18 });
    for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(petalGeo, pm); const a = (i / 6) * Math.PI * 2; m.position.set(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 0); m.scale.set(1, 1, 0.45); head.add(m); }
    const center = new THREE.Mesh(this.geo("fcenter", () => new THREE.SphereGeometry(0.16, 10, 8)), this.lam("#ffd84a", { emissive: "#ffb000", emissiveIntensity: 0.2 }));
    center.position.z = 0.06; head.add(center);
    g.add(stem, leaf, head);
    g.position.set(x, 0, z); g.scale.setScalar(s);
    g.userData = { stem, head, leaf };
    return g;
  }
  growFlower(f: THREE.Group, grow: number, sway = 0, faceCam = true) {
    const { stem, head, leaf } = f.userData as { stem: THREE.Mesh; head: THREE.Group; leaf: THREE.Mesh };
    const sg = Math.min(1, Math.max(0, grow * 1.6));
    stem.scale.y = Math.max(0.001, sg);
    leaf.visible = grow > 0.3;
    const b = Math.max(0, Math.min(1, (grow - 0.55) / 0.45));
    const bo = b <= 0 ? 0 : 1 + 2.70158 * Math.pow(b - 1, 3) + 1.70158 * Math.pow(b - 1, 2);
    head.scale.setScalar(Math.max(0.001, bo));
    head.position.set(sway * 0.1, sg, 0);
    f.rotation.z = -sway * 0.06;
    if (faceCam) { const wp = new THREE.Vector3(); f.getWorldPosition(wp); f.rotation.y = Math.atan2(this.cam.position.x - wp.x, this.cam.position.z - wp.z); }
  }

  heart(color = "#ff5f8f", s = 1) {
    const geo = this.geo("heart", () => {
      const sh = new THREE.Shape();
      sh.moveTo(0, -1); sh.bezierCurveTo(-1.3, -0.1, -1.2, 1.0, -0.5, 1.0); sh.bezierCurveTo(-0.2, 1.0, 0, 0.75, 0, 0.5);
      sh.bezierCurveTo(0, 0.75, 0.2, 1.0, 0.5, 1.0); sh.bezierCurveTo(1.2, 1.0, 1.3, -0.1, 0, -1);
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.3, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3, curveSegments: 16 });
      g.center(); return g;
    });
    const m = this.add(new THREE.Mesh(geo, this.lam(color, { emissive: color, emissiveIntensity: 0.45 })));
    m.scale.setScalar(s);
    return m;
  }

  rainbow(r = 20, width = 0.9) {
    const g = this.add(new THREE.Group());
    const cols = ["#ff5f6d", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#9775fa"];
    cols.forEach((c, i) => {
      const geo = this.track(new THREE.TorusGeometry(r - i * width, width / 2, 8, 80, Math.PI));
      const m = new THREE.Mesh(geo, this.track(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, fog: false })));
      g.add(m);
    });
    return g;
  }
  setOpacity(o: THREE.Object3D, a: number) {
    o.traverse((c) => { const m = (c as THREE.Mesh).material as THREE.Material | undefined; if (m && "opacity" in m) { m.transparent = true; m.opacity = a; } });
    o.visible = a > 0.01;
  }

  clock(r = 3) {
    const g = this.add(new THREE.Group());
    const face = new THREE.Mesh(this.geo("clockface", () => { const c = new THREE.CylinderGeometry(1, 1, 0.2, 48); c.rotateX(Math.PI / 2); return c; }), this.lam("#fffaf0", { emissive: "#fff8e0", emissiveIntensity: 0.3 }));
    const rim = new THREE.Mesh(this.geo("clockrim", () => new THREE.TorusGeometry(1, 0.09, 10, 48)), this.lam("#e86a4a"));
    g.add(face, rim);
    for (let i = 0; i < 12; i++) {
      const tk = new THREE.Mesh(this.geo("tick", () => new THREE.BoxGeometry(0.06, 0.16, 0.05)), this.lam("#4a3a30"));
      const a = (i / 12) * Math.PI * 2; tk.position.set(Math.sin(a) * 0.82, Math.cos(a) * 0.82, 0.12); tk.rotation.z = -a; g.add(tk);
    }
    const mk = (len: number, wd: number) => { const piv = new THREE.Group(); const m = new THREE.Mesh(this.track(new THREE.BoxGeometry(wd, len, 0.05)), this.lam("#4a3a30")); m.position.y = len / 2; piv.add(m); piv.position.z = 0.16; g.add(piv); return piv; };
    const hour = mk(0.5, 0.08), minute = mk(0.78, 0.05);
    const pin = new THREE.Mesh(this.geo("pin", () => new THREE.SphereGeometry(0.08, 8, 6)), this.lam("#e86a4a")); pin.position.z = 0.2; g.add(pin);
    g.scale.setScalar(r);
    return { group: g, hour, minute };
  }

  globe(r = 6) {
    const W = 512, H = 256;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2f7fd6"; g.fillRect(0, 0, W, H);
    const lights = document.createElement("canvas"); lights.width = W; lights.height = H;
    const lg = lights.getContext("2d")!; lg.fillStyle = "#000"; lg.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) {
      const cx = rnd(i * 13) * W, cy = H * 0.2 + rnd(i * 7) * H * 0.6, rx = 30 + rnd(i * 3) * 55, ry = 18 + rnd(i * 5) * 35;
      for (const dx of [-W, 0, W]) {
        g.fillStyle = "#56b866"; g.beginPath(); g.ellipse(cx + dx, cy, rx, ry, rnd(i) * 2, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#86d07a"; g.beginPath(); g.ellipse(cx + dx - rx * 0.2, cy - ry * 0.2, rx * 0.5, ry * 0.45, 0, 0, Math.PI * 2); g.fill();
        lg.fillStyle = "#ffe9a0";
        for (let k = 0; k < 26; k++) lg.fillRect(cx + dx + (rnd(i * 50 + k) - 0.5) * rx * 1.4, cy + (rnd(i * 70 + k) - 0.5) * ry * 1.4, 3, 3);
      }
    }
    g.fillStyle = "#eef6ff"; g.fillRect(0, 0, W, 14); g.fillRect(0, H - 14, W, 14);
    const map = this.track(new THREE.CanvasTexture(c)); map.colorSpace = THREE.SRGBColorSpace;
    const em = this.track(new THREE.CanvasTexture(lights)); em.colorSpace = THREE.SRGBColorSpace;
    const mat = this.track(new THREE.MeshStandardMaterial({ map, emissiveMap: em, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0, roughness: 0.8, metalness: 0 }));
    const mesh = this.add(new THREE.Mesh(this.geo("globe", () => new THREE.SphereGeometry(1, 64, 32)), mat));
    mesh.scale.setScalar(r);
    const atm = this.add(new THREE.Mesh(this.geo("globe", () => new THREE.SphereGeometry(1, 64, 32)), this.track(new THREE.MeshBasicMaterial({ color: "#8fd0ff", transparent: true, opacity: 0.18, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false }))));
    atm.scale.setScalar(r * 1.12);
    // 云层
    const cc = document.createElement("canvas"); cc.width = W; cc.height = H;
    const cg = cc.getContext("2d")!;
    for (let i = 0; i < 40; i++) { cg.fillStyle = "rgba(255,255,255,0.45)"; cg.beginPath(); cg.ellipse(rnd(i * 9) * W, rnd(i * 4) * H, 20 + rnd(i) * 40, 5 + rnd(i * 2) * 6, 0, 0, Math.PI * 2); cg.fill(); }
    const ct = this.track(new THREE.CanvasTexture(cc)); ct.colorSpace = THREE.SRGBColorSpace;
    const cloudsMesh = this.add(new THREE.Mesh(this.geo("globe", () => new THREE.SphereGeometry(1, 64, 32)), this.track(new THREE.MeshStandardMaterial({ map: ct, transparent: true, depthWrite: false }))));
    cloudsMesh.scale.setScalar(r * 1.03);
    return { mesh, mat, atm, clouds: cloudsMesh };
  }

  paperPlane(s = 1, color = "#ffffff") {
    const geo = this.geo("plane", () => {
      const v = new Float32Array([
        0, 0, 1.2, -0.75, 0.05, -0.6, 0, 0, -0.6,
        0, 0, 1.2, 0, 0, -0.6, 0.75, 0.05, -0.6,
        0, 0, 1.2, 0, -0.28, -0.6, 0, 0, -0.6,
      ]);
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(v, 3)); g.computeVertexNormals(); return g;
    });
    const m = this.add(new THREE.Mesh(geo, this.lam(color, { side: THREE.DoubleSide, flatShading: true, emissive: "#cfe6ff", emissiveIntensity: 0.25 })));
    m.scale.setScalar(s);
    return m;
  }

  beam(color: string, len: number, width: number, opacity = 0.45) {
    const geo = this.track(new THREE.CylinderGeometry(width, width * 0.15, len, 20, 1, true));
    geo.translate(0, len / 2, 0);
    const m = this.add(new THREE.Mesh(geo, this.track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))));
    return m;
  }
  /** 让 beam 从 from 指向 to，并按 q(0..1) 伸长。 */
  aim(m: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, q = 1) {
    const dir = to.clone().sub(from);
    const len = dir.length();
    m.position.copy(from);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    m.scale.set(1, Math.max(0.001, q * len / ((m as THREE.Mesh).geometry as THREE.CylinderGeometry).parameters.height), 1);
  }

  ring(color: string, r = 1, tube = 0.08) {
    return this.add(new THREE.Mesh(this.track(new THREE.TorusGeometry(r, tube, 8, 64)), this.track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }))));
  }

  /** 彩色纸屑：返回 update(t)。 */
  confetti(n = 160, area = 14, h = 12, center = new THREE.Vector3(0, 0, 0)) {
    const geo = this.track(new THREE.PlaneGeometry(0.16, 0.09));
    const mat = this.track(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, fog: false }));
    const im = this.add(new THREE.InstancedMesh(geo, mat, n));
    const cols = ["#ff6fae", "#ffd84a", "#5fd0ff", "#8affc1", "#ff8a3d", "#a78bfa"].map((c) => new THREE.Color(c));
    for (let i = 0; i < n; i++) im.setColorAt(i, cols[i % cols.length]);
    const o = new THREE.Object3D();
    return (t: number, a = 1) => {
      im.visible = a > 0.01;
      for (let i = 0; i < n; i++) {
        const y = h - (((rnd(i * 2) * h) + t * (1.5 + rnd(i) * 2)) % (h + 1));
        o.position.set(center.x + (rnd(i) - 0.5) * area + Math.sin(t * 2 + i) * 0.4, center.y + y, center.z + (rnd(i * 3) - 0.5) * area * 0.6);
        o.rotation.set(t * 3 + i, t * 4 + i * 2, 0);
        o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    };
  }

  /** 镜头前的速度线（挂在相机上）。 */
  speedLines(n = 60, color = "#ffffff", opacity = 0.7) {
    const geo = this.track(new THREE.BoxGeometry(0.015, 0.015, 2.5));
    const mat = this.track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, fog: false, depthWrite: false }));
    const im = this.add(new THREE.InstancedMesh(geo, mat, n), this.camGroup);
    const o = new THREE.Object3D();
    return (t: number) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(i) * Math.PI * 2, r = 1.2 + rnd(i * 3) * 3;
        const z = -((rnd(i * 5) * 30 + t * 40) % 30) - 1;
        o.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.6, z);
        o.updateMatrix(); im.setMatrixAt(i, o.matrix);
      }
      im.instanceMatrix.needsUpdate = true;
    };
  }

  /** 漂浮光点（萤火/飘尘）。 */
  motes(n = 80, area = 12, h = 6, color = "#fff6c0", size = 3) {
    const pos = new Float32Array(n * 3);
    const geo = this.track(new THREE.BufferGeometry());
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = this.track(new THREE.PointsMaterial({ color, size, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    const pts = this.add(new THREE.Points(geo, mat));
    return (t: number) => {
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (rnd(i) - 0.5) * area + Math.sin(t + i) * 0.3;
        pos[i * 3 + 1] = ((rnd(i * 2) * h + t * (0.3 + rnd(i * 3) * 0.6)) % h);
        pos[i * 3 + 2] = (rnd(i * 4) - 0.5) * area * 0.6;
      }
      geo.attributes.position.needsUpdate = true;
      return pts;
    };
  }

  canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, nearest = false) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d")!);
    const t = this.track(new THREE.CanvasTexture(c));
    t.colorSpace = THREE.SRGBColorSpace;
    if (nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; }
    t.userData.canvas = c;
    return t;
  }

  room(dim = 0, w = 16, h = 8, d = 14) {
    const g = this.add(new THREE.Group());
    const wall = this.canvasTex(256, 128, (c) => {
      c.fillStyle = "#f3e6d4"; c.fillRect(0, 0, 256, 128);
      c.fillStyle = "#ead8c0"; for (let x = 0; x < 256; x += 16) c.fillRect(x, 0, 6, 128);
      c.fillStyle = "rgba(200,160,130,0.5)"; for (let i = 0; i < 40; i++) c.fillRect(rnd(i) * 256, rnd(i + 3) * 128, 3, 3);
    });
    wall.wrapS = wall.wrapT = THREE.RepeatWrapping; wall.repeat.set(3, 1);
    const floor = this.canvasTex(256, 256, (c) => {
      c.fillStyle = "#b9875a"; c.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 256; y += 32) { c.fillStyle = "#a87648"; c.fillRect(0, y, 256, 3); for (let i = 0; i < 3; i++) c.fillRect(rnd(y + i) * 256, y, 3, 32); }
    });
    floor.wrapS = floor.wrapT = THREE.RepeatWrapping; floor.repeat.set(3, 3);
    const box = new THREE.Mesh(this.track(new THREE.BoxGeometry(w, h, d)), [
      this.track(new THREE.MeshLambertMaterial({ map: wall, side: THREE.BackSide })),
      this.track(new THREE.MeshLambertMaterial({ map: wall, side: THREE.BackSide })),
      this.track(new THREE.MeshLambertMaterial({ color: "#fff6ea", side: THREE.BackSide })),
      this.track(new THREE.MeshLambertMaterial({ map: floor, side: THREE.BackSide })),
      this.track(new THREE.MeshLambertMaterial({ map: wall, side: THREE.BackSide })),
      this.track(new THREE.MeshLambertMaterial({ map: wall, side: THREE.BackSide })),
    ]);
    box.position.y = h / 2; g.add(box);
    const skirt = new THREE.Mesh(this.track(new THREE.BoxGeometry(w - 0.1, 0.3, 0.1)), this.lam("#c79a6c")); skirt.position.set(0, 0.15, -d / 2 + 0.06); g.add(skirt);
    const amb = new THREE.HemisphereLight("#fff6e6", "#b9875a", 1.2 * (1 - dim * 0.75)); g.add(amb);
    const lamp = new THREE.PointLight("#ffe2b0", 30 * (1 - dim * 0.6), 30, 1.6); lamp.position.set(0, h - 1, 2); g.add(lamp);
    g.userData = { amb, lamp, w, h, d };
    return g;
  }

  windowOnWall(x: number, y: number, z: number, w = 4, h = 3, top = "#4aa8ff", bottom = "#cfeeff") {
    const g = this.add(new THREE.Group());
    const sky = this.canvasTex(64, 64, (c) => {
      const gr = c.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, top); gr.addColorStop(1, bottom); c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
      c.fillStyle = "#fff"; c.beginPath(); c.arc(20, 30, 8, 0, 7); c.arc(30, 26, 10, 0, 7); c.arc(40, 31, 7, 0, 7); c.fill();
      c.fillStyle = "#7fcf74"; c.beginPath(); c.ellipse(32, 70, 50, 18, 0, 0, 7); c.fill();
    });
    const pane = new THREE.Mesh(this.track(new THREE.PlaneGeometry(w, h)), this.track(new THREE.MeshBasicMaterial({ map: sky, fog: false })));
    g.add(pane);
    const fm = this.lam("#fff8ee");
    const bars: [number, number, number, number][] = [[0, h / 2, w + 0.4, 0.2], [0, -h / 2, w + 0.6, 0.3], [-w / 2, 0, 0.2, h], [w / 2, 0, 0.2, h], [0, 0, 0.1, h], [0, 0, w, 0.1]];
    for (const [bx, by, bw, bh] of bars) { const b = new THREE.Mesh(this.track(new THREE.BoxGeometry(bw, bh, 0.15)), fm); b.position.set(bx, by, 0.05); g.add(b); }
    g.position.set(x, y, z);
    return g;
  }

  tv() {
    const g = this.add(new THREE.Group());
    const body = new THREE.Mesh(this.track(new THREE.BoxGeometry(2.6, 2.1, 1.8)), this.lam("#7a5232"));
    body.position.y = 1.55; g.add(body);
    const bezel = new THREE.Mesh(this.track(new THREE.BoxGeometry(2.1, 1.6, 0.1)), this.lam("#2a1c12")); bezel.position.set(-0.15, 1.6, 0.9); g.add(bezel);
    const scr = this.canvasTex(96, 72, (c) => { c.fillStyle = "#111"; c.fillRect(0, 0, 96, 72); }, true);
    const screenMat = this.track(new THREE.MeshBasicMaterial({ map: scr, fog: false }));
    const screen = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1.9, 1.4)), screenMat); screen.position.set(-0.15, 1.6, 0.96); g.add(screen);
    for (let i = 0; i < 2; i++) { const k = new THREE.Mesh(this.geo("knob", () => { const c = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12); c.rotateX(Math.PI / 2); return c; }), this.lam("#d9c09a")); k.position.set(1.08, 1.9 - i * 0.45, 0.92); g.add(k); }
    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 6)), this.lam("#4a3220")); leg.position.set(sx * 1.0, 0.25, 0.5); g.add(leg);
      const leg2 = leg.clone(); leg2.position.z = -0.5; g.add(leg2);
      const ant = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6)), this.lam("#555")); ant.position.set(sx * 0.4, 3.2, 0); ant.rotation.z = -sx * 0.45; g.add(ant);
      const tip = new THREE.Mesh(this.geo("anttip", () => new THREE.SphereGeometry(0.07, 8, 6)), this.lam("#999")); tip.position.set(sx * 0.73, 3.92, 0); g.add(tip);
    }
    const c = scr.userData.canvas as HTMLCanvasElement;
    const ctx = c.getContext("2d")!;
    const draw = (mode: "off" | "static" | "bars" | "loop", t: number) => {
      if (mode === "off") { ctx.fillStyle = "#111"; ctx.fillRect(0, 0, 96, 72); }
      else if (mode === "static") {
        const img = ctx.createImageData(96, 72); const f = Math.floor(t * 24);
        for (let i = 0; i < 96 * 72; i++) { const v = Math.floor(rnd(i + f * 7919) * 255); img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255; }
        ctx.putImageData(img, 0, 0);
      } else if (mode === "bars") {
        const cols = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];
        cols.forEach((cc, i) => { ctx.fillStyle = cc; ctx.fillRect((i * 96) / 7, 0, 96 / 7 + 1, 52); });
        ctx.fillStyle = "#111"; ctx.fillRect(0, 52, 96, 20);
      } else {
        ctx.fillStyle = "#28407a"; ctx.fillRect(0, 0, 96, 72);
        ctx.save(); ctx.translate(48, 36); ctx.rotate(t * 4); ctx.fillStyle = "#9fc6ff"; ctx.fillRect(-12, -12, 24, 24); ctx.restore();
      }
      ctx.fillStyle = "rgba(0,0,0,0.25)"; for (let y = 0; y < 72; y += 2) ctx.fillRect(0, y, 96, 1);
      scr.needsUpdate = true;
    };
    draw("off", 0);
    return { group: g, draw, screen };
  }

  teddy() {
    const g = this.add(new THREE.Group());
    const fur = this.lam("#a8693a"), light = this.lam("#e2b48a"), dark = this.lam("#2a1a10");
    const sp = this.geo("ball", () => new THREE.SphereGeometry(1, 20, 14));
    const part = (m: THREE.Material, x: number, y: number, z: number, sx: number, sy = sx, sz = sx) => { const p = new THREE.Mesh(sp, m); p.position.set(x, y, z); p.scale.set(sx, sy, sz); g.add(p); return p; };
    part(fur, 0, 0.6, 0, 0.55, 0.6, 0.5); part(light, 0, 0.55, 0.32, 0.32, 0.36, 0.2);
    part(fur, 0, 1.35, 0, 0.45); part(fur, -0.36, 1.7, 0, 0.16); part(fur, 0.36, 1.7, 0, 0.16);
    part(light, 0, 1.25, 0.38, 0.18, 0.14, 0.12); part(dark, 0, 1.3, 0.5, 0.05);
    part(dark, -0.16, 1.45, 0.38, 0.05); part(dark, 0.16, 1.45, 0.38, 0.05);
    part(fur, -0.55, 0.75, 0.1, 0.18, 0.3, 0.18); part(fur, 0.55, 0.75, 0.1, 0.18, 0.3, 0.18);
    part(fur, -0.3, 0.15, 0.3, 0.2, 0.18, 0.28); part(fur, 0.3, 0.15, 0.3, 0.2, 0.18, 0.28);
    return g;
  }
  rocket() {
    const g = this.add(new THREE.Group());
    const body = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 20)), this.lam("#f4f4f4")); body.position.y = 0.95; g.add(body);
    const band = new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 20)), this.lam("#e03a3a")); band.position.y = 0.6; g.add(band);
    const nose = new THREE.Mesh(this.track(new THREE.ConeGeometry(0.35, 0.6, 20)), this.lam("#e03a3a")); nose.position.y = 1.95; g.add(nose);
    const win = new THREE.Mesh(this.geo("ball", () => new THREE.SphereGeometry(1, 20, 14)), this.lam("#4aa8ff", { emissive: "#2060a0", emissiveIntensity: 0.4 })); win.scale.set(0.15, 0.15, 0.06); win.position.set(0, 1.2, 0.34); g.add(win);
    for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(this.track(new THREE.BoxGeometry(0.06, 0.45, 0.35)), this.lam("#e03a3a")); const a = (i / 3) * Math.PI * 2; f.position.set(Math.sin(a) * 0.38, 0.4, Math.cos(a) * 0.38); f.rotation.y = a; g.add(f); }
    return g;
  }
  block(letter = "A", color = "#e8c070") {
    const tex = this.canvasTex(64, 64, (c) => { c.fillStyle = color; c.fillRect(0, 0, 64, 64); c.strokeStyle = "#8a5a2a"; c.lineWidth = 6; c.strokeRect(3, 3, 58, 58); c.fillStyle = "#d03a3a"; c.font = "bold 44px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(letter, 32, 35); });
    const m = this.add(new THREE.Mesh(this.track(new THREE.BoxGeometry(0.8, 0.8, 0.8)), this.track(new THREE.MeshLambertMaterial({ map: tex }))));
    m.position.y = 0.4;
    return m;
  }
  house(wall: string, roof: string, s = 1) {
    const g = this.add(new THREE.Group());
    const b = new THREE.Mesh(this.geo("hbox", () => new THREE.BoxGeometry(2, 1.6, 2)), this.lam(wall)); b.position.y = 0.8; g.add(b);
    const r = new THREE.Mesh(this.geo("hroof", () => new THREE.ConeGeometry(1.7, 1.1, 4)), this.lam(roof)); r.position.y = 2.15; r.rotation.y = Math.PI / 4; g.add(r);
    const w = new THREE.Mesh(this.geo("hwin", () => new THREE.PlaneGeometry(0.5, 0.45)), this.lam("#9fd6ff", { emissive: "#ffe9a0", emissiveIntensity: 0.15 })); w.position.set(0.45, 1.0, 1.01); g.add(w);
    const d = new THREE.Mesh(this.geo("hdoor", () => new THREE.PlaneGeometry(0.45, 0.8)), this.lam("#8a5a3a")); d.position.set(-0.4, 0.4, 1.01); g.add(d);
    g.scale.setScalar(s);
    return g;
  }
  tree(s = 1) {
    const g = this.add(new THREE.Group());
    const t = new THREE.Mesh(this.geo("trunk", () => new THREE.CylinderGeometry(0.15, 0.2, 1.2, 8)), this.lam("#7a4a2a")); t.position.y = 0.6; g.add(t);
    const c = new THREE.Mesh(this.geo("crown", () => new THREE.IcosahedronGeometry(0.9, 1)), this.lam("#3fa84f", { flatShading: true })); c.position.y = 1.7; g.add(c);
    g.scale.setScalar(s);
    return g;
  }
  mountain(s = 1) {
    const g = this.add(new THREE.Group());
    const m = new THREE.Mesh(this.geo("mtn", () => new THREE.ConeGeometry(2, 3.2, 7)), this.lam("#8aa0c8", { flatShading: true })); m.position.y = 1.6; g.add(m);
    const cap = new THREE.Mesh(this.geo("mtncap", () => new THREE.ConeGeometry(0.75, 1.2, 7)), this.lam("#ffffff", { flatShading: true })); cap.position.y = 2.65; g.add(cap);
    g.scale.setScalar(s);
    return g;
  }
  island(color: string, r = 3) {
    const g = this.add(new THREE.Group());
    const top = new THREE.Mesh(this.track(new THREE.CylinderGeometry(r, r * 0.92, 0.5, 32)), this.lam(color)); g.add(top);
    const rock = new THREE.Mesh(this.track(new THREE.ConeGeometry(r * 0.92, r * 1.4, 10)), this.lam("#a07a5a", { flatShading: true })); rock.rotation.x = Math.PI; rock.position.y = -0.25 - r * 0.7; g.add(rock);
    return g;
  }

  /** 每帧：角色纸片朝向相机（只转 y 轴）。 */
  tick() {
    const cp = this.cam.position;
    const wp = new THREE.Vector3();
    for (const s of this.sprites) {
      if (!s.billboard) continue;
      s.mesh.getWorldPosition(wp);
      s.mesh.rotation.y = Math.atan2(cp.x - wp.x, cp.z - wp.z);
    }
  }

  dispose() {
    this.w.camera.remove(this.camGroup);
    const geos = new Set<THREE.BufferGeometry>(), mats = new Set<THREE.Material>();
    const walk = (o: THREE.Object3D) => o.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.geometry) geos.add(m.geometry);
      if (m.material) (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => mats.add(x));
    });
    walk(this.group); walk(this.camGroup);
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    this.disposables.forEach((d) => d.dispose());
  }
}
