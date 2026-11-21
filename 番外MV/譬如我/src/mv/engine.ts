import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import atlasUrl from "../assets/atlas.png";
import { ATLAS_H, ATLAS_W, RECTS, ACTIONS } from "./atlasData";
import { LINES, type LineT } from "./lyricsData";
import { Cards } from "./cards";
import { clamp, lerp, glowTex } from "./tex";

// ───────── 调色板：夜 / 昼 / 黎明 ─────────
export interface Pal { name: string; bg: number; fog: number; floor: number; wall: number; sprite: number; key: number; keyI: number; amb: number; bloom: number; sat: number; grain: number }
export const PALS: Record<string, Pal> = {
  night: { name: "night", bg: 0x05060b, fog: 0.028, floor: 0x1a1b24, wall: 0x20212c, sprite: 0xdfe4ff, key: 0x9fb2ff, keyI: 1.2, amb: 0.5, bloom: 0.5, sat: 0.7, grain: 0.09 },
  day: { name: "day", bg: 0xe8e8e4, fog: 0.018, floor: 0xdad9d3, wall: 0xf0efe9, sprite: 0xffffff, key: 0xffffff, keyI: 1.5, amb: 1.0, bloom: 0.18, sat: 0.55, grain: 0.07 },
  dawn: { name: "dawn", bg: 0x1d1620, fog: 0.024, floor: 0x2c2530, wall: 0x372e3a, sprite: 0xfff0e6, key: 0xffc79a, keyI: 1.5, amb: 0.65, bloom: 0.6, sat: 0.95, grain: 0.07 },
};

export type CamFn = (px: number, py: number, pz: number, lx: number, ly: number, lz: number, fov?: number, roll?: number) => void;
export interface Ctx { T: number; u: number; d: number; p: any; pal: Pal; hit: number; cam: THREE.PerspectiveCamera; line: (id: string) => LineT; env: Env }
export interface MvSet { group: THREE.Group; update(x: Ctx): void; onPal?(p: Pal): void }
export interface Shot { s: number; e: number; set: string; pal: keyof typeof PALS; cam: (c: CamFn, u: number, d: number, x: Ctx) => void; p?: any }

const LINE_MAP = new Map(LINES.map((l) => [l.id, l]));
export const lineOf = (id: string) => { const l = LINE_MAP.get(id); if (!l) throw new Error("no line " + id); return l; };

// ───────── 演员：图集里的像素角色，当 2D 纸片人站在 3D 世界里 ─────────
export type Who = "whale" | "gpt" | "claude" | "doubao" | "gemini" | "kimi" | "qwen" | "zai";
const px = 1 / 46; // 1 世界单位 = 46 像素 → 鲸 ≈ 2 个单位高
export class Actor {
  mesh: THREE.Mesh; shadow: THREE.Mesh; mat: THREE.MeshBasicMaterial;
  who: Who; action = "idle"; t0 = 0; roll = 0; flip = 1; k: number; lift = 0; groundY = 0; speed = 1; frozen = -1;
  private geo: THREE.PlaneGeometry; private uv: THREE.BufferAttribute;
  constructor(env: Env, who: Who, action = "idle", k = 1) {
    this.who = who; this.k = k;
    this.geo = new THREE.PlaneGeometry(1, 1); this.geo.translate(0, 0.5, 0);
    this.uv = this.geo.getAttribute("uv") as THREE.BufferAttribute;
    this.mat = new THREE.MeshBasicMaterial({ map: env.atlas, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(this.geo, this.mat); this.mesh.rotation.order = "YZX"; this.mesh.renderOrder = 2;
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: env.glow, transparent: true, depthWrite: false, color: 0x000000, opacity: 0.55 }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = 1;
    this.play(action, 0);
  }
  play(action: string, t0: number) {
    if (!ACTIONS[this.who][action]) { console.warn(`no action ${this.who}.${action}`); action = ACTIONS[this.who].idle ? "idle" : Object.keys(ACTIONS[this.who])[0]; }
    this.action = action; this.t0 = t0; return this;
  }
  add(parent: THREE.Object3D) { parent.add(this.mesh); parent.add(this.shadow); return this; }
  place(x: number, y: number, z: number) { this.mesh.position.set(x, y, z); this.groundY = y; return this; }
  shade(c: number, o = 1) { this.mat.color.set(c); this.mat.opacity = o; return this; }
  show(v: boolean) { this.mesh.visible = v; this.shadow.visible = v; return this; }
  update(T: number, cam: THREE.Camera) {
    const a = ACTIONS[this.who][this.action]; const n = a.frames.length;
    const f = this.frozen >= 0 ? this.frozen : Math.floor(Math.max(0, T - this.t0) * a.fps * this.speed);
    const idx = a.loop ? ((f % n) + n) % n : Math.min(n - 1, f);
    const [x, y, w, h] = RECTS[a.frames[idx]];
    const e = 0.4;
    const u0 = (x + e) / ATLAS_W, u1 = (x + w - e) / ATLAS_W, v0 = 1 - (y + h - e) / ATLAS_H, v1 = 1 - (y + e) / ATLAS_H;
    this.uv.setXY(0, u0, v1); this.uv.setXY(1, u1, v1); this.uv.setXY(2, u0, v0); this.uv.setXY(3, u1, v0); this.uv.needsUpdate = true;
    const s = px * this.k;
    this.mesh.scale.set(w * s * this.flip, h * s, 1);
    const p = this.mesh.position; this.mesh.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z); this.mesh.rotation.z = this.roll;
    this.shadow.position.set(p.x, this.groundY + 0.02, p.z); const sh = w * s * 0.8 * (1 - clamp((p.y - this.groundY) * 0.12, 0, 0.5));
    this.shadow.scale.set(sh, sh * 0.5, 1);
  }
}

// ───────── 环境：共享资源 ─────────
export class Env {
  atlas!: THREE.Texture; glow = glowTex("255,255,255", 1);
  async load() {
    this.atlas = await new THREE.TextureLoader().loadAsync(atlasUrl);
    this.atlas.colorSpace = THREE.SRGBColorSpace; this.atlas.magFilter = THREE.NearestFilter; this.atlas.minFilter = THREE.LinearFilter; this.atlas.generateMipmaps = false;
  }
  actor(who: Who, action = "idle", k = 1) { return new Actor(this, who, action, k); }
}

// ───────── 后期：色差 / 暗角 / 颗粒 / 划痕 / 闪白 ─────────
const FX = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, hit: { value: 0 }, vig: { value: 0.8 }, grain: { value: 0.08 }, sat: { value: 0.8 }, flash: { value: 0 }, fade: { value: 0 }, dim: { value: 1 }, roll: { value: 0 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: `
  uniform sampler2D tDiffuse; uniform float time,hit,vig,grain,sat,flash,fade,dim,roll; varying vec2 vUv;
  float h(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
  void main(){
    vec2 uv=vUv; vec2 c=uv-.5;
    uv += vec2(sin(time*37.)*.0007, cos(time*29.)*.0005)*(1.+hit*3.);
    float ca=.0012+hit*.009;
    vec3 col; col.r=texture2D(tDiffuse,uv+c*ca*2.).r; col.g=texture2D(tDiffuse,uv).g; col.b=texture2D(tDiffuse,uv-c*ca*2.).b;
    float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,sat);
    float v=smoothstep(.98,.2,length(c*vec2(1.15,1.))); col*=mix(1.,v,vig);
    float sx=floor(time*12.);
    float g=h(floor(gl_FragCoord.xy)+floor(time*24.)*17.); col+=(g-.5)*grain;
    float ln=step(.99975,h(vec2(floor(uv.x*500.),sx))); col+=ln*.12*step(.6,h(vec2(sx,3.)));
    float dust=step(.99975,h(floor(uv*vec2(200.,112.))+sx*3.)); col=mix(col,vec3(1.-step(.5,l)),dust*.4);
    col*=1.+.025*sin(time*60.);
    col+=flash; col=mix(col,vec3(0.),fade); col*=dim;
    gl_FragColor=vec4(col,1.);
  }`,
};

// ───────── 主控 ─────────
export class MV {
  renderer: THREE.WebGLRenderer; composer: EffectComposer; world = new THREE.Scene(); cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 200);
  tScene = new THREE.Scene(); tCam = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 100);
  env = new Env(); sets: Record<string, MvSet> = {}; shots: Shot[] = []; cards!: Cards; fx: ShaderPass; bloom: UnrealBloomPass;
  amb = new THREE.AmbientLight(0xffffff, 0.5); key = new THREE.DirectionalLight(0xffffff, 1.2); curPal = "";
  flashes: [number, number, number][] = [[30.13, 1.0, 0.45], [0, 0.0, 1]]; fades: [number, number][] = [];
  hitTimes: number[] = []; totalDur = 152.1; lastShot: Shot | null = null;
  constructor(canvas: HTMLCanvasElement, w: number, h: number) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); this.renderer.setSize(w, h, false);
    this.world.add(this.amb, this.key); this.key.position.set(4, 8, 6);
    const ta = new THREE.AmbientLight(0xffffff, 0.75), td = new THREE.DirectionalLight(0xffffff, 2.4); td.position.set(-3, 5, 8);
    const tr = new THREE.DirectionalLight(0x7f8fff, 1.6); tr.position.set(6, -2, 3); this.tScene.add(ta, td, tr);
    this.composer = new EffectComposer(this.renderer);
    const rp = new RenderPass(this.world, this.cam); const rp2 = new RenderPass(this.tScene, this.tCam); rp2.clear = false; rp2.clearDepth = true;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.6, 0.85);
    this.fx = new ShaderPass(FX as any);
    this.composer.addPass(rp); this.composer.addPass(rp2); this.composer.addPass(this.bloom); this.composer.addPass(this.fx); this.composer.addPass(new OutputPass());
    this.resize(w, h);
    this.hitTimes = LINES.flatMap((l) => l.t).sort((a, b) => a - b);
  }
  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false); this.composer.setSize(w, h);
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.tCam.aspect = w / h; this.tCam.updateProjectionMatrix();
  }
  addSet(id: string, s: MvSet) { this.sets[id] = s; s.group.visible = false; this.world.add(s.group); }
  shotAt(T: number) { for (const s of this.shots) if (T >= s.s && T < s.e) return s; return this.shots[this.shots.length - 1]; }
  hitAt(T: number) {
    const a = this.hitTimes; let lo = 0, hi = a.length - 1, best = -1;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (a[m] <= T) { best = m; lo = m + 1; } else hi = m - 1; }
    return best < 0 ? 0 : Math.exp(-(T - a[best]) / 0.15);
  }
  applyPal(name: string) {
    if (this.curPal === name) return; this.curPal = name; const p = PALS[name];
    this.world.background = new THREE.Color(p.bg); this.world.fog = new THREE.FogExp2(p.bg, p.fog);
    this.amb.intensity = p.amb; this.key.color.set(p.key); this.key.intensity = p.keyI;
    this.bloom.strength = p.bloom; this.bloom.threshold = name === "day" ? 0.95 : 0.8;
    this.fx.uniforms.sat.value = p.sat; this.fx.uniforms.grain.value = p.grain; this.fx.uniforms.vig.value = name === "day" ? 0.55 : 0.85;
  }
  render(T: number) {
    T = clamp(T, 0, this.totalDur);
    const shot = this.shotAt(T); const pal = PALS[shot.pal]; this.applyPal(shot.pal);
    const hit = this.hitAt(T); const u = T - shot.s, d = shot.e - shot.s;
    if (this.lastShot !== shot) { for (const id in this.sets) this.sets[id].group.visible = id === shot.set; this.lastShot = shot; }
    const set = this.sets[shot.set]; if (!set) throw new Error("no set " + shot.set);
    const x: Ctx = { T, u, d, p: shot.p || {}, pal, hit, cam: this.cam, line: lineOf, env: this.env };
    set.onPal?.(pal);
    let roll = 0;
    const cam: CamFn = (px_, py, pz, lx, ly, lz, fov = 40, r = 0) => {
      const sh = hit * 0.035;
      this.cam.position.set(px_ + Math.sin(T * 51) * sh, py + Math.cos(T * 47) * sh, pz);
      this.cam.up.set(0, 1, 0); this.cam.lookAt(lx, ly, lz); this.cam.rotateZ(r); roll = r;
      this.cam.fov = fov - hit * 1.6; this.cam.updateProjectionMatrix();
    };
    shot.cam(cam, u, d, x);
    set.update(x);
    this.cards.update(T, this.tCam, hit, roll);
    // 全局闪白与淡入淡出
    let flash = 0; for (const [t, k, dec] of this.flashes) if (T >= t && k > 0) flash = Math.max(flash, k * Math.exp(-(T - t) / (dec * 0.4)));
    for (const s of this.shots) if (Math.abs(T - s.s) < 0.012 && s.s > 0) flash = Math.max(flash, 0.0);
    const fade = Math.max(1 - clamp(T / 0.7), clamp((T - 151.3) / 0.8));
    const U = this.fx.uniforms; U.time.value = T; U.hit.value = hit; U.flash.value = flash; U.fade.value = fade; U.roll.value = roll;
    this.composer.render();
  }
}
export { lerp };
