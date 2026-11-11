import * as THREE from "three";
import { BAR, BAR0, BEAT, FPS, ease, lerp, type V3 } from "../core";
import type { Cue } from "../cues";
import { Actor, type AtlasData } from "./actors";
import { Rain, Sky } from "./kit";
import { buildBar, buildRoof, buildRoom, buildStreet, buildVanity, ENV0, type Env, type LookId, type SetId, type StageSet } from "./sets";

// ---------------- 机位 ----------------
export interface Cam {
  pos: V3;
  look: V3;
  fov: number;
  roll?: number;
}
export const cam = (pos: V3, look: V3, fov = 38, roll = 0): Cam => ({ pos, look, fov, roll });
const l3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export function glide(a: Cam, b: Cam, u: number, e: (x: number) => number = ease): Cam {
  const t = e(u);
  return { pos: l3(a.pos, b.pos, t), look: l3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll ?? 0, b.roll ?? 0, t) };
}
/** 绕 center 转：ang = 0 时机位在 +z 方向 */
export function orbit(center: V3, r: number, ang: number, h: number, fov = 38, lookY = center[1]): Cam {
  return cam([center[0] + Math.sin(ang) * r, h, center[2] + Math.cos(ang) * r], [center[0], lookY, center[2]], fov);
}
/** 多关键帧机位，每段都带缓动 */
export function track(keys: [number, Cam][], u: number): Cam {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [u0, c0] = keys[i];
    const [u1, c1] = keys[i + 1];
    if (u <= u1) return glide(c0, c1, (u - u0) / (u1 - u0));
  }
  return keys[keys.length - 1][1];
}
export const shake = (c: Cam, amt: number, T: number): Cam => ({
  ...c,
  pos: [c.pos[0] + Math.sin(T * 31) * amt, c.pos[1] + Math.sin(T * 27 + 1) * amt, c.pos[2]],
});

// ---------------- 光照预设 ----------------
interface Look {
  top: number;
  hor: number;
  bot: number;
  fog: number;
  fogD: number;
  hemiSky: number;
  hemiGround: number;
  hemiI: number;
  dirC: number;
  dirI: number;
  dirPos: V3;
  stars: number;
  moon: number;
  moonDir: V3;
  sprite: number;
  rain: number;
}
const LOOKS: Record<LookId, Look> = {
  night: { top: 0x050a1f, hor: 0x2a3466, bot: 0x0a0d1a, fog: 0x161c3c, fogD: 0.03, hemiSky: 0x7084d8, hemiGround: 0x1a1428, hemiI: 1.3, dirC: 0x9fb4ff, dirI: 0.9, dirPos: [-4, 8, 6], stars: 0.9, moon: 1, moonDir: [-0.35, 0.33, -1], sprite: 0xd8def8, rain: 0xa8c4ff },
  dawn: { top: 0x3a3a78, hor: 0xf2a07a, bot: 0x2a1e3a, fog: 0x7a6a90, fogD: 0.022, hemiSky: 0xc0a8e0, hemiGround: 0x3a2a3a, hemiI: 1.7, dirC: 0xffc8a0, dirI: 1.6, dirPos: [6, 4, 4], stars: 0.05, moon: 0, moonDir: [-0.35, 0.33, -1], sprite: 0xfff0ea, rain: 0xe8d8ff },
  bar: { top: 0x0a0410, hor: 0x1a0822, bot: 0x0a0410, fog: 0x1a0822, fogD: 0.03, hemiSky: 0x9a5ac0, hemiGround: 0x1a0820, hemiI: 1.1, dirC: 0xff7ad0, dirI: 0.5, dirPos: [2, 6, 6], stars: 0, moon: 0, moonDir: [0, 0.3, -1], sprite: 0xffe0f8, rain: 0xffb9e6 },
  room: { top: 0x0b1230, hor: 0x1b2450, bot: 0x0b1230, fog: 0x20182a, fogD: 0.018, hemiSky: 0xc8b8e0, hemiGround: 0x2a2030, hemiI: 1.4, dirC: 0xffe0b0, dirI: 0.5, dirPos: [2, 5, 6], stars: 0, moon: 0, moonDir: [0, 0.3, -1], sprite: 0xfff2e6, rain: 0xa8c4ff },
  roof: { top: 0x040820, hor: 0x24305e, bot: 0x080a18, fog: 0x141a3a, fogD: 0.012, hemiSky: 0x7a8ad0, hemiGround: 0x141022, hemiI: 1.4, dirC: 0xd0dcff, dirI: 1.3, dirPos: [-2, 6, -8], stars: 1, moon: 1, moonDir: [0.12, 0.3, -1], sprite: 0xe4e8ff, rain: 0xa8c4ff },
  memory: { top: 0x7cc0ff, hor: 0xffe6c0, bot: 0xc0a080, fog: 0xffe8c8, fogD: 0.014, hemiSky: 0xfff0d0, hemiGround: 0x806040, hemiI: 2.2, dirC: 0xfff2d0, dirI: 2.2, dirPos: [5, 9, 6], stars: 0, moon: 0, moonDir: [0, 0.3, -1], sprite: 0xffffff, rain: 0xffffff },
  vanity: { top: 0x120a14, hor: 0x2a1424, bot: 0x120a14, fog: 0x1e1018, fogD: 0.015, hemiSky: 0xe0b8c8, hemiGround: 0x2a1820, hemiI: 1.3, dirC: 0xffd8c0, dirI: 0.6, dirPos: [2, 5, 6], stars: 0, moon: 0, moonDir: [0, 0.3, -1], sprite: 0xfff0e8, rain: 0xffffff },
};

// ---------------- 镜头契约 ----------------
export interface Fx {
  flash: number;
  black: number;
  sepia: number;
  vignette: number;
  title: "pre" | "end" | null;
  titleA: number;
}
export interface Frame {
  T: number;
  t: number;
  u: number;
  dur: number;
  bar: number;
  beat: number;
  pulse: number;
  bi: number;
  v: number;
  frame: number;
  env: Env;
  fx: Fx;
}
export interface Kit {
  A: AtlasData;
  set: StageSet;
  add: <T extends THREE.Object3D>(o: T, x?: number, y?: number, z?: number) => T;
  actor: (id: string, size?: number, big?: boolean) => Actor;
}
export interface ShotDef {
  id: string;
  set: SetId;
  start: number;
  end: number;
  v: number;
  cue: Cue | null;
  title: string;
  note: string;
  cast: string;
  build: (k: Kit) => (f: Frame) => Cam;
}
interface Built {
  group: THREE.Group;
  actors: Actor[];
  fn: (f: Frame) => Cam;
}

export interface UserOrbit {
  yaw: number;
  pitch: number;
  zoom: number;
}

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.05, 900);
  sets: Record<SetId, StageSet>;
  sky = new Sky();
  rain = new Rain();
  hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
  dir = new THREE.DirectionalLight(0xffffff, 1);
  lights: THREE.PointLight[] = [];
  fog = new THREE.FogExp2(0x000000, 0.03);
  built = new Map<string, Built>();
  user: UserOrbit = { yaw: 0, pitch: 0, zoom: 1 };
  private tmpA = new THREE.Color();
  private tmpB = new THREE.Color();
  private spriteLight = new THREE.Color();

  constructor(public canvas: HTMLCanvasElement, w: number, h: number, public A: AtlasData, public shots: ShotDef[]) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(w, h, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.scene.fog = this.fog;
    this.scene.add(this.sky.mesh, this.sky.stars, this.sky.moon, this.rain.lines, this.hemi, this.dir, this.dir.target);
    for (let i = 0; i < 4; i++) {
      const L = new THREE.PointLight(0xffffff, 0, 0, 2);
      this.lights.push(L);
      this.scene.add(L);
    }
    this.sets = { street: buildStreet(), bar: buildBar(), room: buildRoom(), roof: buildRoof(), vanity: buildVanity() };
    Object.values(this.sets).forEach((s) => {
      s.group.visible = false;
      this.scene.add(s.group);
    });
  }

  setSize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
  }

  shotAt(T: number) {
    let lo = 0;
    let hi = this.shots.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this.shots[mid].start <= T) lo = mid;
      else hi = mid - 1;
    }
    return this.shots[lo];
  }

  ensure(s: ShotDef): Built {
    let b = this.built.get(s.id);
    if (b) return b;
    const group = new THREE.Group();
    group.visible = false;
    this.scene.add(group);
    const actors: Actor[] = [];
    const set = this.sets[s.set];
    const kit: Kit = {
      A: this.A,
      set,
      add: (o, x, y, z) => {
        if (x !== undefined) o.position.set(x, y ?? 0, z ?? 0);
        group.add(o);
        return o;
      },
      actor: (id, size = 1, big = false) => {
        const a = new Actor(id, this.A, size, big);
        actors.push(a);
        group.add(a.group);
        return a;
      },
    };
    b = { group, actors, fn: s.build(kit) };
    this.built.set(s.id, b);
    return b;
  }

  /** 预先搭好所有镜头并编译着色器（出片前调用，避免中途卡顿） */
  prewarm() {
    for (const s of this.shots) this.ensure(s);
    for (const s of this.shots) this.render(s.start + 0.01);
  }

  render(T: number, withUser = false): { shot: ShotDef; f: Frame } {
    const shot = this.shotAt(T);
    const b = this.ensure(shot);
    const set = this.sets[shot.set];
    for (const [id, s] of Object.entries(this.sets)) s.group.visible = id === shot.set;
    for (const [id, bb] of this.built) bb.group.visible = id === shot.id;

    const dur = shot.end - shot.start;
    const t = T - shot.start;
    const beats = (T - BAR0) / BEAT;
    const beat = ((beats % 1) + 1) % 1;
    const f: Frame = {
      T,
      t,
      u: Math.min(1, Math.max(0, dur > 0 ? t / dur : 0)),
      dur,
      bar: (T - BAR0) / BAR,
      beat,
      pulse: Math.exp(-beat * 5.5),
      bi: Math.floor(beats),
      v: shot.v,
      frame: Math.round(T * FPS),
      env: { ...ENV0, ...set.defaults },
      fx: { flash: 0, black: 0, sepia: 0, vignette: 0.5, title: null, titleA: 0 },
    };
    for (const a of b.actors) a.reset();
    const c = b.fn(f);
    for (const v of [...c.pos, ...c.look, c.fov]) if (!Number.isFinite(v)) throw new Error(`镜头 ${shot.id} 的机位里有坏数`);

    // 机位（可叠加用户自由视角）
    const pos = new THREE.Vector3(...c.pos);
    const look = new THREE.Vector3(...c.look);
    if (withUser && (this.user.yaw !== 0 || this.user.pitch !== 0 || this.user.zoom !== 1)) {
      const off = pos.clone().sub(look);
      const sph = new THREE.Spherical().setFromVector3(off);
      sph.theta += this.user.yaw;
      sph.phi = Math.min(Math.PI - 0.15, Math.max(0.15, sph.phi - this.user.pitch));
      sph.radius *= this.user.zoom;
      pos.copy(look).add(new THREE.Vector3().setFromSpherical(sph));
    }
    this.camera.position.copy(pos);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(look);
    if (c.roll) this.camera.rotateZ(c.roll);
    this.camera.fov = c.fov;
    this.camera.aspect = this.canvas.width / this.canvas.height;
    this.camera.updateProjectionMatrix();

    // 布景动画 + 灯
    set.update({ T, bar: f.bar, beat, pulse: f.pulse, bi: f.bi, env: f.env, lights: this.lights, focusX: c.look[0] });

    // 光照预设（可向黎明混合）
    const L = LOOKS[f.env.look ?? set.look];
    const D = LOOKS.dawn;
    const k = f.env.look ? 0 : f.env.dawn;
    const mixC = (a: number, bb: number, out: THREE.Color) => out.set(a).lerp(this.tmpB.set(bb), k);
    mixC(L.top, D.top, this.sky.uni.top.value);
    mixC(L.hor, D.hor, this.sky.uni.hor.value);
    mixC(L.bot, D.bot, this.sky.uni.bot.value);
    mixC(L.fog, D.fog, this.fog.color);
    this.fog.density = lerp(L.fogD, D.fogD, k) * f.env.fog;
    mixC(L.hemiSky, D.hemiSky, this.hemi.color);
    mixC(L.hemiGround, D.hemiGround, this.hemi.groundColor);
    this.hemi.intensity = lerp(L.hemiI, D.hemiI, k);
    mixC(L.dirC, D.dirC, this.dir.color);
    this.dir.intensity = lerp(L.dirI, D.dirI, k);
    this.dir.position.set(...L.dirPos).add(look);
    this.dir.target.position.copy(look);
    (this.sky.stars.material as THREE.PointsMaterial).opacity = lerp(L.stars, D.stars, k);
    this.sky.moon.visible = lerp(L.moon, D.moon, k) > 0.5;
    this.sky.follow(this.camera, new THREE.Vector3(...L.moonDir).normalize());
    mixC(L.sprite, D.sprite, this.spriteLight);
    this.rain.update(T, f.env.rain, c.look[0] + f.env.rainX, f.env.rainZ, f.env.wind, mixC(L.rain, D.rain, this.tmpA));

    for (const a of b.actors) a.apply(this.camera, this.spriteLight);
    this.renderer.render(this.scene, this.camera);
    return { shot, f };
  }

  dispose() {
    this.renderer.dispose();
  }
}
