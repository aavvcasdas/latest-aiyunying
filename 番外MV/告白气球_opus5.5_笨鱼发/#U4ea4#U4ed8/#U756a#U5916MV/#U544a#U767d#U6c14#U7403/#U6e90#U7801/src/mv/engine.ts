import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import atlasUrl from "../assets/atlas.png";
import { ACTIONS, ATLAS_H, ATLAS_W, RECTS, THINGS } from "./atlasData";
import { LINES, type LineT } from "./lyricsData";
import type { Cards } from "./cards";
import { clamp, glowTex } from "./tex";

// ───────── 调色板：晨 / 黄昏 / 夜 / 梦 ─────────
export interface Pal {
  name: string; sky: [number, number, number]; fog: number; amb: number; hemi: [number, number, number]; key: number; keyI: number;
  bloom: number; bloomT: number; sat: number; grain: number; vig: number; tint: [number, number, number]; sprite: number; lamps: number;
}
export const PALS: Record<string, Pal> = {
  morning: { name: "morning", sky: [0x8fc0ef, 0xd6e8f5, 0xfbe9d6], fog: 0.010, amb: 0.75, hemi: [0xdfefff, 0xd8c3a0, 0.7], key: 0xfff1dc, keyI: 1.6, bloom: 0.32, bloomT: 0.9, sat: 1.0, grain: 0.03, vig: 0.45, tint: [1.02, 1.0, 0.97], sprite: 0xffffff, lamps: 0 },
  sunset: { name: "sunset", sky: [0x6f6fb8, 0xf2a07a, 0xffd59a], fog: 0.012, amb: 0.6, hemi: [0xffc9a0, 0x6a4a5a, 0.6], key: 0xffb27a, keyI: 1.5, bloom: 0.5, bloomT: 0.82, sat: 1.05, grain: 0.035, vig: 0.55, tint: [1.06, 0.98, 0.92], sprite: 0xffe6d6, lamps: 0.35 },
  night: { name: "night", sky: [0x0c1230, 0x1d2a5a, 0x3b3a6a], fog: 0.014, amb: 0.45, hemi: [0x6f7fc8, 0x2a2030, 0.5], key: 0xaab8ff, keyI: 0.7, bloom: 0.5, bloomT: 0.84, sat: 1.0, grain: 0.04, vig: 0.62, tint: [0.98, 0.98, 1.06], sprite: 0xf2ecff, lamps: 1 },
  dream: { name: "dream", sky: [0x3a2a6a, 0x9a6ab8, 0xffc4d8], fog: 0.012, amb: 0.7, hemi: [0xffd6ea, 0x5a3a7a, 0.7], key: 0xffe0f0, keyI: 1.1, bloom: 0.55, bloomT: 0.8, sat: 1.05, grain: 0.035, vig: 0.6, tint: [1.04, 0.97, 1.05], sprite: 0xfff2fa, lamps: 0.8 },
};

export type CamFn = (px: number, py: number, pz: number, lx: number, ly: number, lz: number, fov?: number, roll?: number) => void;
export interface Ctx { T: number; u: number; d: number; p: any; pal: Pal; hit: number; cam: THREE.PerspectiveCamera; line: (id: string) => LineT; env: Env }
export interface MvSet { group: THREE.Group; update(x: Ctx): void; onPal?(p: Pal): void }
export type CardPos = "top" | "bottom" | "left" | "right" | "center" | "none";
export interface Shot { s: number; e: number; set: string; pal: keyof typeof PALS; cam: (c: CamFn, u: number, d: number, x: Ctx) => void; p?: any; cp?: CardPos }

const LINE_MAP = new Map(LINES.map((l) => [l.id, l]));
export const lineOf = (id: string) => { const l = LINE_MAP.get(id); if (!l) throw new Error("no line " + id); return l; };

// ───────── 像素格子：演员与道具共用的一块贴图面 ─────────
const PX = 1 / 46; // 1 世界单位 = 46 像素 → 本鲸约 2 个单位高
function uvRect(uv: THREE.BufferAttribute, key: string) {
  const r = RECTS[key]; if (!r) throw new Error("图集缺格 " + key);
  const [x, y, w, h] = r; const e = 0.35;
  const u0 = (x + e) / ATLAS_W, u1 = (x + w - e) / ATLAS_W, v0 = 1 - (y + h - e) / ATLAS_H, v1 = 1 - (y + e) / ATLAS_H;
  uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true; return r;
}
export type Who = "whale" | "gpt" | "claude" | "doubao" | "gemini" | "kimi" | "qwen" | "zai";

export class Thing {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; frames: string[]; k: number; fps = 6; roll = 0; billboard = true; private uv: THREE.BufferAttribute;
  constructor(env: Env, name: string, k = 1) {
    const f = THINGS[name]; if (!f) throw new Error("没有道具 " + name); this.frames = f; this.k = k;
    const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); this.uv = g.getAttribute("uv") as THREE.BufferAttribute;
    this.mat = new THREE.MeshBasicMaterial({ map: env.atlas, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, fog: false });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.renderOrder = 3; this.mesh.rotation.order = "YXZ";
  }
  add(p: THREE.Object3D) { p.add(this.mesh); return this; }
  at(x: number, y: number, z: number) { this.mesh.position.set(x, y, z); this.mesh.visible = true; return this; }
  hide() { this.mesh.visible = false; return this; }
  update(T: number, cam: THREE.Camera) {
    if (!this.mesh.visible) return;
    const [, , w, h] = uvRect(this.uv, this.frames[Math.floor(Math.max(0, T) * this.fps) % this.frames.length]);
    const s = PX * this.k; this.mesh.scale.set(w * s, h * s, 1);
    if (this.billboard) { const p = this.mesh.position; this.mesh.rotation.y = Math.atan2(cam.position.x - p.x, cam.position.z - p.z); }
    this.mesh.rotation.z = this.roll;
  }
}

export class Actor {
  mesh: THREE.Mesh; shadow: THREE.Mesh; mat: THREE.MeshBasicMaterial; fx: Thing; held: Thing | null = null;
  who: Who; action = "idle"; t0 = 0; roll = 0; flip = 1; shadowOn = true; k: number; groundY = 0; speed = 1; h = 2; private uv: THREE.BufferAttribute; private fxOn = ""; private heldDx = 0.55; private heldDy = 0.75;
  constructor(env: Env, who: Who, action = "idle", k = 1) {
    this.who = who; this.k = k;
    const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); this.uv = g.getAttribute("uv") as THREE.BufferAttribute;
    this.mat = new THREE.MeshBasicMaterial({ map: env.atlas, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.rotation.order = "YZX"; this.mesh.renderOrder = 2;
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: env.glow, transparent: true, depthWrite: false, color: 0x000000, opacity: 0.4 }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = 1;
    this.fx = new Thing(env, "fx_heart", 1.6); this.fx.hide();
    this.act(action, 0);
  }
  /** 播动作；不存在就报错（缺素材就报错，不悄悄替换） */
  act(action: string, t0 = 0) { if (!ACTIONS[this.who][action]) throw new Error(`没有动作 ${this.who}.${action}`); this.action = action; this.t0 = t0; return this; }
  add(parent: THREE.Object3D) { parent.add(this.mesh, this.shadow, this.fx.mesh); return this; }
  at(x: number, y: number, z: number) { this.mesh.position.set(x, y, z); this.groundY = y; return this; }
  shade(c: number, o = 1) { this.mat.color.set(c); this.mat.opacity = o; this.mat.transparent = true; return this; }
  show(v: boolean) { this.mesh.visible = v; this.shadow.visible = v; if (!v) { this.fx.hide(); if (this.held) this.held.hide(); } return this; }
  /** 头顶表情贴：每帧要显示就每帧调 */
  emote(name: string) { this.fxOn = name; return this; }
  /** 手边的像素道具（不画假手：放在手边略靠前） */
  hold(t: Thing | null, dx = 0.55, dy = 0.75) { if (this.held && this.held !== t) this.held.hide(); this.held = t; this.heldDx = dx; this.heldDy = dy; return this; }
  update(T: number, cam: THREE.Camera) {
    const vis = this.mesh.visible;
    const a = ACTIONS[this.who][this.action]; const n = a.frames.length;
    const f = Math.floor(Math.max(0, T - this.t0) * a.fps * this.speed);
    const idx = a.loop ? ((f % n) + n) % n : Math.min(n - 1, f);
    const [, , w, h] = uvRect(this.uv, a.frames[idx]);
    const s = PX * this.k; this.h = h * s;
    this.mesh.scale.set(w * s * this.flip, h * s, 1);
    const p = this.mesh.position; const yaw = Math.atan2(cam.position.x - p.x, cam.position.z - p.z); this.mesh.rotation.y = yaw; this.mesh.rotation.z = this.roll;
    this.shadow.position.set(p.x, this.groundY + 0.02, p.z); const sh = w * s * 0.75 * (1 - clamp((p.y - this.groundY) * 0.15, 0, 0.6)); this.shadow.scale.set(sh, sh * 0.45, 1); this.shadow.visible = vis && this.shadowOn;
    if (vis && this.fxOn) { const fr = THINGS[this.fxOn]; this.fx.frames = fr; this.fx.at(p.x, p.y + this.h + 0.12 + Math.sin(T * 5) * 0.04, p.z + 0.05); this.fx.update(T, cam); } else this.fx.hide();
    this.fxOn = "";
    if (this.held) { if (vis) { const side = this.flip; const cx = Math.cos(yaw), cz = -Math.sin(yaw); this.held.at(p.x + cx * this.heldDx * side * this.k + Math.sin(yaw) * 0.12, p.y + this.heldDy * this.k, p.z + cz * this.heldDx * side * this.k + Math.cos(yaw) * 0.12); this.held.update(T, cam); } else this.held.hide(); }
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
  thing(name: string, k = 1) { return new Thing(this, name, k); }
}

// ───────── 后期：轻颗粒 / 轻色差 / 暗角 / 调色 / 淡入淡出 ─────────
const FX = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, hit: { value: 0 }, vig: { value: 0.5 }, grain: { value: 0.03 }, sat: { value: 1 }, flash: { value: 0 }, fade: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) } },
  vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: `
  uniform sampler2D tDiffuse; uniform float time,hit,vig,grain,sat,flash,fade; uniform vec3 tint; varying vec2 vUv;
  float h(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
  void main(){
    vec2 uv=vUv; vec2 c=uv-.5; float ca=.0006+hit*.0018;
    vec3 col; col.r=texture2D(tDiffuse,uv+c*ca*2.).r; col.g=texture2D(tDiffuse,uv).g; col.b=texture2D(tDiffuse,uv-c*ca*2.).b;
    float l=dot(col,vec3(.299,.587,.114)); col=mix(vec3(l),col,sat); col*=tint;
    float v=smoothstep(1.0,.25,length(c*vec2(1.1,1.))); col*=mix(1.,v,vig);
    float g=h(floor(gl_FragCoord.xy)+floor(time*24.)*17.); col+=(g-.5)*grain;
    col+=flash; col=mix(col,vec3(0.),fade);
    gl_FragColor=vec4(col,1.);
  }`,
};

// 天空穹顶：三段渐变，跟着相机走
function skyDome() {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() } },
    vertexShader: "varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
    fragmentShader: "uniform vec3 top,mid,bot; varying vec3 vP; void main(){ float y=vP.y; vec3 c= y>0.08 ? mix(mid,top,smoothstep(0.08,0.7,y)) : mix(bot,mid,smoothstep(-0.15,0.08,y)); gl_FragColor=vec4(c,1.); }",
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 16), m); s.renderOrder = -10; s.frustumCulled = false; return s;
}

// ───────── 主控 ─────────
export class MV {
  renderer: THREE.WebGLRenderer; composer: EffectComposer; world = new THREE.Scene(); cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 400);
  tScene = new THREE.Scene(); tCam = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 100);
  env = new Env(); sets: Record<string, MvSet> = {}; shots: Shot[] = []; cards!: Cards; fx: ShaderPass; bloom: UnrealBloomPass;
  amb = new THREE.AmbientLight(0xffffff, 0.5); hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5); key = new THREE.DirectionalLight(0xffffff, 1.2); sky = skyDome(); curPal = "";
  flashes: [number, number][] = []; fadeIn = 0.8; fadeOutAt = 210.6; totalDur = 212.98; hitTimes: number[] = []; lastShot: Shot | null = null;
  constructor(canvas: HTMLCanvasElement, w: number, h: number) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); this.renderer.setSize(w, h, false);
    this.world.add(this.amb, this.hemi, this.key, this.sky); this.key.position.set(6, 10, 8);
    const ta = new THREE.AmbientLight(0xffffff, 0.95), td = new THREE.DirectionalLight(0xffffff, 1.9); td.position.set(-3, 5, 8);
    const tr = new THREE.DirectionalLight(0xffb0cc, 1.2); tr.position.set(6, -2, 3); this.tScene.add(ta, td, tr);
    this.composer = new EffectComposer(this.renderer);
    const rp = new RenderPass(this.world, this.cam); const rp2 = new RenderPass(this.tScene, this.tCam); rp2.clear = false; rp2.clearDepth = true;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.45, 0.55, 0.85);
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
    const U = this.sky.material as THREE.ShaderMaterial; U.uniforms.top.value.set(p.sky[0]); U.uniforms.mid.value.set(p.sky[1]); U.uniforms.bot.value.set(p.sky[2]);
    this.world.background = new THREE.Color(p.sky[2]); this.world.fog = new THREE.FogExp2(p.sky[2], p.fog);
    this.amb.intensity = p.amb; this.hemi.color.set(p.hemi[0]); this.hemi.groundColor.set(p.hemi[1]); this.hemi.intensity = p.hemi[2];
    this.key.color.set(p.key); this.key.intensity = p.keyI;
    this.bloom.strength = p.bloom; this.bloom.threshold = p.bloomT;
    const F = this.fx.uniforms; F.sat.value = p.sat; F.grain.value = p.grain; F.vig.value = p.vig; F.tint.value.set(...p.tint);
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
    const cam: CamFn = (px, py, pz, lx, ly, lz, fov = 40, r = 0) => {
      const sh = hit * 0.008;
      this.cam.position.set(px + Math.sin(T * 41) * sh, py + Math.cos(T * 37) * sh, pz);
      this.cam.up.set(0, 1, 0); this.cam.lookAt(lx, ly, lz); this.cam.rotateZ(r); roll = r;
      this.cam.fov = fov; this.cam.updateProjectionMatrix();
    };
    shot.cam(cam, u, d, x);
    this.sky.position.copy(this.cam.position);
    set.update(x);
    this.cards.update(T, this.tCam, hit, roll);
    let flash = 0; for (const [t, k] of this.flashes) if (T >= t) flash = Math.max(flash, k * Math.exp(-(T - t) / 0.18));
    const fade = Math.max(1 - clamp(T / this.fadeIn), clamp((T - this.fadeOutAt) / 2.2));
    const U = this.fx.uniforms; U.time.value = T; U.hit.value = hit; U.flash.value = flash; U.fade.value = fade;
    this.composer.render();
  }
}
